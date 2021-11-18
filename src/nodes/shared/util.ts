import { OFFSET_COUNTER, OFFSET_ID, OFFSET_LIST_ID, OFFSET_PACKET_INDEX, OFFSET_PACKET_SIZE, OFFSET_VAR_COUNT, PACKET_HEADER_SIZE } from './constants'
import { NvDefinition, NvType, NvPacketHeader, NvSegmentDefinition } from './types'

export function times<T>(repeat: number, callback: (index: number) => T): T[] {
  const arr: T[] = []
  for (let i=0; i<repeat; i++)
    arr.push(callback(i))
  return arr
}

export function buildNetworkVariableListJSON(netvars: NvDefinition[]): Record<string, any> {
  const nvl: Record<string, any> = {}
  for (const netvar of netvars) {
    nvl[netvar.name]
      = netvar.isArray
        ? buildNetworkVariableListJSONArray(netvar.dimensions, getInitialValue(netvar.type))
        : getInitialValue(netvar.type)
  }

  return nvl
}

function buildNetworkVariableListJSONArray(dimensions: number[], fill: any): any[] {
  const recurse = (rest: number[]): any[] => 
    rest.length === 1
      ? times(rest[0], () => fill)
      : times(rest[0], () => recurse(rest.slice(1)))
  
  return recurse(dimensions)
}

/** Get zero-based value for given Netvar Type */
function getInitialValue(type: NvType): boolean | number | bigint | string {
  switch (type) {
    case 'LWORD':
    case 'ULINT':
    case 'LINT':
      // TODO: BigInt
      return 0
    case 'BOOL':
      return false
    case 'STRING':
      return ''
    default:
      return 0
  }
}

const byteSizes: Readonly<Record<NvType, number>> = {
  // boolean
  BOOL: 1,
  // integer
  BYTE: 1,
  WORD: 2,
  DWORD: 4,
  LWORD: 8,
  SINT: 1,
  USINT: 1,
  INT: 2,
  UINT: 2,
  DINT: 4,
  UDINT: 4,
  LINT: 8,
  ULINT: 8,
  // float
  REAL: 4,
  LREAL: 8,
  // string (default)
  STRING: 81,
  // time
  TIME: 4,
  TIME_OF_DAY: 4,
  DATE: 4,
  DATE_AND_TIME: 4,
}

export function getSizeOf(type: NvType): number {
  return byteSizes[type] || 0
}

export type BufferReader<Output extends number | bigint | string | boolean = number | bigint | string | boolean> = 
  (buffer: Buffer, offset?: number) => Output

export function getReaderOf(type: Exclude<NvType, 'BOOL' | 'LWORD' | 'LINT' | 'ULINT' | 'STRING'>): BufferReader<number> 
export function getReaderOf(type: 'LWORD' | 'LINT' | 'ULINT'): BufferReader<bigint> 
export function getReaderOf(type: 'STRING'): BufferReader<string> 
export function getReaderOf(type: 'BOOL'): BufferReader<boolean>
export function getReaderOf(type: NvType): BufferReader
export function getReaderOf(type: NvType): BufferReader {
  switch (type) {
    case 'BOOL':
      return (buffer: Buffer, offset?: number) =>
        buffer.readUInt8(offset) === 1
    case 'BYTE':
    case 'USINT':
      return (buffer: Buffer, offset?: number) =>
        buffer.readUInt8(offset)
    case 'SINT':
      return (buffer: Buffer, offset?: number) =>
        buffer.readInt8(offset)
    case 'WORD':
    case 'UINT':
      return (buffer: Buffer, offset?: number) =>
        buffer.readUInt16LE(offset)
    case 'INT':
      return (buffer: Buffer, offset?: number) =>
        buffer.readInt16LE(offset)
    case 'DWORD':
    case 'UDINT':
    case 'TIME':
    case 'TIME_OF_DAY':
    case 'DATE':
    case 'DATE_AND_TIME':
      return (buffer: Buffer, offset?: number) =>
        buffer.readUInt32LE(offset)
    case 'DINT':
      return (buffer: Buffer, offset?: number) =>
        buffer.readInt32LE(offset)
    case 'LWORD':
    case 'ULINT':
      return (buffer: Buffer, offset?: number) =>
        buffer.readBigUInt64LE(offset)
    case 'LINT':
      return (buffer: Buffer, offset?: number) =>
        buffer.readBigInt64LE(offset)
    case 'REAL':
      return (buffer: Buffer, offset?: number) =>
        buffer.readFloatLE(offset)
    case 'LREAL':
      return (buffer: Buffer, offset?: number) =>
        buffer.readDoubleLE(offset)
    case 'STRING':
      return (buffer: Buffer, offset = 0) => 
        buffer.toString('ascii', offset, buffer.indexOf(0, offset, 'ascii'))
    default:
      throw new TypeError('Unrecognized data type')
  }
}

export function readPacketHeader(buffer: Buffer): NvPacketHeader {
  if (buffer.length < 20)
    throw new TypeError('Network Variable UDP packets should be at least 20 byte long')
  return {
    id: buffer.readUInt32LE(OFFSET_ID),
    listId: buffer.readUInt16LE(OFFSET_LIST_ID),
    packetIndex: buffer.readUInt16LE(OFFSET_PACKET_INDEX),
    variableCount: buffer.readUInt16LE(OFFSET_VAR_COUNT),
    packetSize: buffer.readUInt16LE(OFFSET_PACKET_SIZE),
    counter: buffer.readUInt32LE(OFFSET_COUNTER),
  }
}

export function readPacketIndex(buffer: Buffer): number {
  if (buffer.length < PACKET_HEADER_SIZE)
    throw new TypeError(`Network Variable UDP packets should be at least ${PACKET_HEADER_SIZE} byte long`)
  return buffer.readUInt16LE(10)
}

export function writePacketHeader(buffer: Buffer, header: NvPacketHeader): void {
  if (buffer.length < PACKET_HEADER_SIZE)
    throw new TypeError(`Network Variable UDP packets should be at least ${PACKET_HEADER_SIZE} byte long`)
  buffer.writeUInt32LE(header.id, OFFSET_ID)
  buffer.writeUInt16LE(header.listId, OFFSET_LIST_ID)
  buffer.writeUInt16LE(header.packetIndex, OFFSET_PACKET_INDEX)
  buffer.writeUInt16LE(header.variableCount, OFFSET_VAR_COUNT)
  buffer.writeUInt16LE(header.packetSize, OFFSET_PACKET_SIZE)
  buffer.writeUInt32LE(header.counter, OFFSET_COUNTER)
}

/** Calculates the total number of variables in all definitions */
export function countVariables(definitions: NvSegmentDefinition[]): number {
  let variableCount = 0
  for (const definition of definitions) {
    if (definition.isArray) 
      variableCount += definition.end - definition.begin
    else 
      variableCount += 1
  }
  return variableCount
}
