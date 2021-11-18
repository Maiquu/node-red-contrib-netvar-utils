import { times } from '../../shared/util'
import { PACKET_HEADER_SIZE } from '../../shared/constants'
import { NvType, NvPacketReader, NvPacket, NvSegmentDefinition, NvArraySegmentDefinition } from '../../shared/types'
import { getForStatementRanges, generateSafeVariableName } from './util'

/**
 * Renders expression that reads buffer based on type
 */
function renderReadExpression(type: NvType): string {
  switch (type) {
    case 'BOOL':
      return 'buffer.readUInt8(offset) === 1'
    case 'BYTE':
    case 'USINT':
      return 'buffer.readUInt8(offset)'
    case 'SINT':
      return 'buffer.readInt8(offset)'
    case 'WORD':
    case 'UINT':
      return 'buffer.readUInt16LE(offset)'
    case 'INT':
      return 'buffer.readInt16LE(offset)'
    case 'DWORD':
    case 'UDINT':
    case 'TIME':
    case 'TIME_OF_DAY':
      return 'buffer.readUInt32LE(offset)'
    case 'DATE':
    case 'DATE_AND_TIME':
      return 'buffer.readUInt32LE(offset) * 1000'
    case 'DINT':
      return 'buffer.readInt32LE(offset)'
    case 'LWORD':
    case 'ULINT':
      return 'buffer.readBigUInt64LE(offset)'
    case 'LINT':
      return 'buffer.readBigInt64LE(offset)'
    case 'REAL':
      return 'buffer.readFloatLE(offset)'
    case 'LREAL':
      return 'buffer.readDoubleLE(offset)'
    case 'STRING':
      return 'buffer.toString(\'ascii\', offset, buffer.indexOf(0, offset, \'ascii\'))'
    default:
      throw new TypeError('Unrecognized data type')
  }
}

/**
 * Renders `ForStatement` that creates a array object based on definition
 */
function renderForStatement(definition: NvArraySegmentDefinition) {
  const { dimensions, type, size, begin, end } = definition
  const length = dimensions.length
  const indexNames = times(length, generateSafeVariableName)
  const prefix = `target['${definition.name}']`
  const ranges = getForStatementRanges(dimensions, begin, end)

  let string = ''
  
  for (const range of ranges) {
    const { begin, end } = range

    let leftExpression = prefix
    let idx = 0

    while (idx < dimensions.length && begin[idx] === end[idx]) {
      leftExpression += `[${begin[idx]}]`
      idx++
    }

    const sameIndexUntil = idx

    // Render for statements
    for (let i = sameIndexUntil; i < dimensions.length; i++) {
      string += 'for ('
      string += `let ${indexNames[i]}=${begin[i]};`
      string += `${indexNames[i]}<${end[i]};`
      string += `${indexNames[i]}++) {\n`
    }
    string += leftExpression
    for (let i = sameIndexUntil; i < dimensions.length; i++) 
      string += `[${indexNames[i]}]`

    string += ` = ${renderReadExpression(type)}\n`
    string += `offset += ${size}\n` 
    
    for (let i = sameIndexUntil; i < dimensions.length; i++) 
      string += '}\n'
  }

  return string
}

/**
 * Renders the block for reading a network variable and assigning result to `result` object
 */
function renderReadStatement(definition: NvSegmentDefinition) {
  let string = ''
  if (definition.isArray) {
    string += `${renderForStatement(definition)}\n`
  }
  else {
    string += `target['${definition.name}'] = ${renderReadExpression(definition.type)}\n`
    string += `offset += ${definition.size}\n`
  }
  return string
}

/**
 * Compiles the function that reads network variable list data, and mutates the target object.
 * Assumes receieved packet is valid.
 */
export function compilePacketReader(packet: NvPacket): NvPacketReader {
  let fn = `let offset = ${PACKET_HEADER_SIZE}\n`
  for (const definition of packet.definitions)
    fn += renderReadStatement(definition)
  return new Function('target', 'buffer', fn) as NvPacketReader
}
