import { NodeInitializer } from 'node-red'
import { Parser, Grammar } from 'nearley'
import { NvDefinition, NvPacket } from '../shared/types'
import { NvlConfigNode, NvlConfigNodeDef } from './modules/types'
import { MAX_PACKET_SIZE, MAX_VARIABLE_SIZE, PACKET_HEADER_SIZE } from '../shared/constants'
import grammar from './modules/nvl-grammar'
import { compilePacketReader } from './modules/compile-reader'
import { compilePacketEmitter } from './modules/compile-emitter'

const nodeInit: NodeInitializer = (RED): void => {
  function NvlConfigNodeConstructor(this: NvlConfigNode, config: NvlConfigNodeDef): void {
    RED.nodes.createNode(this, config)
    this.definitions = parseNetvarList(this, config.netvarList)
    this.expectedPackets = getExpectedPackets(this.definitions)
    this.readers = this.expectedPackets.map(packet => 
      compilePacketReader(packet, {
        id: config.projectId,
        listId: config.netvarListId,
      }),
    )

    this.emitters = this.expectedPackets.map(packet => 
      compilePacketEmitter(packet, {
        id: config.projectId,
        listId: config.netvarListId,
      }),
    )

    this.readers.forEach(reader => console.log(reader.toString()))

  }

  RED.nodes.registerType('nvl-config', NvlConfigNodeConstructor)
}

function parseNetvarList(node: NvlConfigNode, netvars: string): NvDefinition[] {
  const parser = new Parser(Grammar.fromCompiled(grammar))
  parser.feed(netvars.trim())
  if (parser.results.length > 1) 
    node.warn('Network Variable Grammar is ambigious!')
  return parser.results[0] || []
}

/** Get expected packets, their sizes and the variables they should contain by interpreting network variable list definitions */
function getExpectedPackets(definitions: NvDefinition[]): NvPacket[] {

  const packets: NvPacket[] = []
  const defineNewPacket = (index: number): NvPacket => ({
    index,
    size: PACKET_HEADER_SIZE,
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
        currentPacket.definitions.push({
          ...definition,
          begin: 0, 
          end: volume,
        })
      }
      else {
        let volumeIndex = Math.floor(remainder / unitSize)
        currentPacket.size += volumeIndex * unitSize
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
        currentPacket.definitions.push(definition)
        if (definition.size > MAX_VARIABLE_SIZE) {
          packets.push(currentPacket)
          currentPacket = defineNewPacket(packets.length)
        }
      }
      else {
        currentPacket.size += definition.size
        currentPacket.definitions.push(definition)
      }
    }
  }
  if (currentPacket.definitions.length > 0) 
    packets.push(currentPacket)
  
  return packets
}


export = nodeInit
