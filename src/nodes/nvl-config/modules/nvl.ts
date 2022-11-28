import Ajv, { ValidateFunction } from 'ajv'
import { Grammar, Parser } from 'nearley'
import rfdc from 'rfdc'
import { MAX_PACKET_SIZE, MAX_VARIABLE_SIZE, OFFSET_LIST_ID, OFFSET_PACKET_INDEX, OFFSET_PACKET_SIZE, OFFSET_VAR_COUNT, PACKET_HEADER_SIZE } from '../../shared/constants'
import { NvDefinition, NvPacket, NvPacketEmitter, NvPacketReader } from '../../shared/types'
import { buildNetworkVariableListJSON, isNvlPacket } from '../../shared/util'
import { NvlConfigNode, NvlConfigNodeDef } from '../types'
import { compilePacketEmitter } from './compile-emitter'
import { compilePacketReader } from './compile-reader'
import grammar from './nvl-grammar'
import { buildJSONSchemaFromDefinitions, JSONSchema } from './util'

const ajv = new Ajv()
const clone = rfdc()

export class Nvl {
  
  readonly listId: number
  readonly validateJSON: ValidateFunction<Record<string, any>>

  private definitions: NvDefinition[]
  private template: Record<string, any>
  private schema: JSONSchema
  private expectedPackets: NvPacket[]
  private readers: NvPacketReader[]
  private emitters: NvPacketEmitter[]

  constructor(node: NvlConfigNode, config: NvlConfigNodeDef) {

    this.listId = parseInt(config.netvarListId)
    this.definitions = this.parseNetvarList(node, config.netvarList)
    this.template = buildNetworkVariableListJSON(this.definitions)
    this.schema = buildJSONSchemaFromDefinitions(this.definitions)
    this.expectedPackets = this.getExpectedPackets(this.definitions)

    this.validateJSON = ajv.compile<Record<string, any>>(this.schema)

    this.readers = this.expectedPackets.map(packet => 
      compilePacketReader(packet),
    )
    this.emitters = this.expectedPackets.map(packet => 
      compilePacketEmitter(packet, this.listId),
    )
  }

  createEmptyJSON() {
    return clone(this.template)
  }

  /** Check if received packet is expected according to given configuration */
  isExpectedPacket(packet: Buffer): boolean {
    if (!isNvlPacket(packet)) return false
    const index = packet.readUInt16LE(OFFSET_PACKET_INDEX)
    const expectedPacket = this.expectedPackets[index]
    return expectedPacket
      && this.listId === packet.readUInt16LE(OFFSET_LIST_ID)
      && expectedPacket.size === packet.readUInt16LE(OFFSET_PACKET_SIZE)
      && expectedPacket.variableCount === packet.readUInt16LE(OFFSET_VAR_COUNT)
  }

  getExpectedPacketCount(): number {
    return this.expectedPackets.length
  }
  
  /** Mutates target object */
  readPacket(target: Record<string, any>, packet: Buffer): void {
    const index = packet.readUInt16LE(OFFSET_PACKET_INDEX)
    const reader = this.readers[index]
    reader(target, packet)
  }

  emitPackets(target: Record<string, any>, counter = 0): Buffer[] {
    counter = Math.floor(counter)
    counter %= 65535
    return this.emitters.map((emitter, index) => 
      emitter(target, counter + index),  
    )
  }

  /** Get expected packets, their sizes and the variables they should contain by interpreting network variable list definitions */
  private getExpectedPackets(definitions: NvDefinition[]): NvPacket[] {
  
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

  private parseNetvarList(node: NvlConfigNode, nvl: string) {
    const parser = new Parser(Grammar.fromCompiled(grammar), {})
    try {
      parser.feed(nvl.trim())
      if (parser.results.length > 1) 
        node.debug('[WARN] Network variable grammar is ambigious!')
    }
    catch (err) {
      node.error(this.createNetvarSyntaxError(err as Error))
    }
    return parser.results?.[0] || []
  }

  private createNetvarSyntaxError(err: Error): SyntaxError {
    const message = `Error while parsing network variable list.\n${
      err.message.slice(0, err.message.indexOf(' Instead'))}`
    return new SyntaxError(message)
  }

}