import Ajv from 'ajv'
import rfdc from 'rfdc'
import { NodeInitializer } from 'node-red'
import { Parser, Grammar } from 'nearley'
import { NvDefinition, NvPacket } from '../shared/types'
import { NvlConfigNode, NvlConfigNodeDef } from './modules/types'
import { MAX_PACKET_SIZE, MAX_VARIABLE_SIZE, OFFSET_PACKET_INDEX, PACKET_HEADER_SIZE } from '../shared/constants'
import grammar from './modules/nvl-grammar'
import { compilePacketReader } from './modules/compile-reader'
import { compilePacketEmitter } from './modules/compile-emitter'
import { buildNetworkVariableListJSON, readPacketHeader } from '../shared/util'
import { buildJSONSchemaFromDefinitions } from './modules/util'

const ajv = new Ajv()
const clone = rfdc()

const nodeInit: NodeInitializer = (RED): void => {
  function NvlConfigNodeConstructor(this: NvlConfigNode, config: NvlConfigNodeDef): void {
    RED.nodes.createNode(this, config)
    // Node-RED converts number inputs to string.
    const projectId = parseInt(config.projectId)
    const netvarListId = parseInt(config.netvarListId)
    const definitions = parseNetvarList(this, config.netvarList)
    const jsonTemplate = buildNetworkVariableListJSON(definitions)
    const jsonSchema = buildJSONSchemaFromDefinitions(definitions)
    const expectedPackets = getExpectedPackets(definitions)

    const packetReaders = expectedPackets.map(packet => 
      compilePacketReader(packet),
    )
    const packetEmitters = expectedPackets.map(packet => 
      compilePacketEmitter(packet, {
        id: projectId,
        listId: netvarListId,
      }),
    )

    //#region Public API

    this.buildNetvarJSON = () => clone(jsonTemplate)

    this.validateNetvarJSON = ajv.compile<Record<string, any>>(jsonSchema)

    // Check if received packet is expected according to given configuration
    this.isExpectedPacket = (packet: Buffer): boolean => {
      if (packet.length < PACKET_HEADER_SIZE) return false
      const header = readPacketHeader(packet)
      const expectedPacket = expectedPackets[header.packetIndex]
      return expectedPacket 
        && header.id === projectId
        && header.listId === netvarListId
        && header.packetSize === expectedPacket.size
        && header.packetSize === packet.length
        && header.variableCount === expectedPacket.variableCount
    }
    
    this.isFirstPacket = (packet: Buffer): boolean => 
      packet.readUInt16LE(OFFSET_PACKET_INDEX) === 0

    this.isLastPacket = (packet: Buffer): boolean => 
      packet.readUInt16LE(OFFSET_PACKET_INDEX) === expectedPackets.length - 1

    this.readPacket = (target: Record<string, any>, packet: Buffer): void => {
      const index = packet.readUInt16LE(OFFSET_PACKET_INDEX)
      const reader = packetReaders[index]
      reader(target, packet)
    }

    this.emitPackets = (target: Record<string, any>, counter: number): Buffer[] => {
      return packetEmitters.map(emitter => 
        emitter(target, counter),  
      )
    }

    //#endregion
    
  }

  RED.nodes.registerType('nvl-config', NvlConfigNodeConstructor)
}

function parseNetvarList(node: NvlConfigNode, netvars: string): NvDefinition[] {
  const parser = new Parser(Grammar.fromCompiled(grammar), {})
  try {
    parser.feed(netvars.trim())
    if (parser.results.length > 1) 
      node.debug('[WARN] Network variable grammar is ambigious!')
  }
  catch (err) {
    node.error(createNetvarSyntaxError(err as Error))
  }
  return parser.results[0] || []
}

/** Get expected packets, their sizes and the variables they should contain by interpreting network variable list definitions */
function getExpectedPackets(definitions: NvDefinition[]): NvPacket[] {

  const packets: NvPacket[] = []
  const defineNewPacket = (index: number): NvPacket => ({
    index,
    size: PACKET_HEADER_SIZE,
    variableCount: 0,
    definitions: [],
  })

  let currentPacket = defineNewPacket(0)

  for (const definition of definitions) {
    const remainder = MAX_PACKET_SIZE - currentPacket.size
    if (definition.isArray) {
      const volume = definition.dimensions.reduce((a, b) => a * b)
      const unitSize = definition.size
      const totalSize = volume * unitSize
      
      if (remainder >= totalSize) {
        currentPacket.size += totalSize
        currentPacket.variableCount += volume
        currentPacket.definitions.push({
          ...definition,
          begin: 0, 
          end: volume,
        })
      }
      else {
        let volumeIndex = Math.floor(remainder / unitSize)
        currentPacket.size += volumeIndex * unitSize
        currentPacket.variableCount += volumeIndex
        currentPacket.definitions.push({
          ...definition,
          begin: 0,
          end: volumeIndex,
        })
        packets.push(currentPacket)
        currentPacket = defineNewPacket(packets.length)
        while (volumeIndex < volume) {
          const remainingUnitCount = volume - volumeIndex
          const remainingArraySize = remainingUnitCount * unitSize
          if (MAX_VARIABLE_SIZE < remainingArraySize) {
            const unitSpan = Math.floor(MAX_VARIABLE_SIZE / unitSize)
            currentPacket.size += unitSpan * unitSize
            currentPacket.variableCount += unitSpan
            currentPacket.definitions.push({
              ...definition,
              begin: volumeIndex,
              end: volumeIndex + unitSpan,
            })
            packets.push(currentPacket)
            currentPacket = defineNewPacket(packets.length)
            volumeIndex += unitSpan
          }
          else {
            currentPacket.size += remainingUnitCount * unitSize
            currentPacket.variableCount += remainingUnitCount
            currentPacket.definitions.push({
              ...definition,
              begin: volumeIndex,
              end: volume,
            })
            volumeIndex = volume
          }
        }
      }
    }
    else {
      if (definition.size > remainder) {
        packets.push(currentPacket)
        currentPacket = defineNewPacket(packets.length)
        currentPacket.size += definition.size
        currentPacket.variableCount += 1
        currentPacket.definitions.push(definition)
        if (definition.size > MAX_VARIABLE_SIZE) {
          packets.push(currentPacket)
          currentPacket = defineNewPacket(packets.length)
        }
      }
      else {
        currentPacket.size += definition.size
        currentPacket.variableCount += 1
        currentPacket.definitions.push(definition)
      }
    }
  }
  if (currentPacket.definitions.length > 0) 
    packets.push(currentPacket)
  
  return packets
}


function createNetvarSyntaxError(err: Error): SyntaxError {
  const message = `Error while parsing network variable list.\n${
    err.message.slice(0, err.message.indexOf(' Instead'))}`
  return new SyntaxError(message)
}

export = nodeInit
