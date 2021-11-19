import { NETVAR_PROTOCOL_ID, OFFSET_COUNTER, OFFSET_LIST_ID, OFFSET_PACKET_INDEX, OFFSET_PACKET_SIZE, OFFSET_PROTOCOL, OFFSET_VAR_COUNT, PACKET_HEADER_SIZE } from '../../shared/constants'
import { times } from '../../shared/util'
import { NvType, NvPacket, NvSegmentDefinition, NvPacketEmitter, NvArraySegmentDefinition } from '../../shared/types'
import { getForStatementRanges, generateSafeVariableName } from './util'

/**
 * Renders expression that writes to buffer based on type
 */
function renderWriteExpression(type: NvType, size: number): string {
  switch (type) {
    case 'BOOL':
      return 'buffer.writeUInt8(value ? 1 : 0, offset)'
    case 'BYTE':
    case 'USINT':
      return 'buffer.writeUInt8(value, offset)'
    case 'SINT':
      return 'buffer.writeInt8(value, offset)'
    case 'WORD':
    case 'UINT':
      return 'buffer.writeUInt16LE(value, offset)'
    case 'INT':
      return 'buffer.writeInt16LE(value, offset)'
    case 'DWORD':
    case 'UDINT':
    case 'TIME':
    case 'TIME_OF_DAY':
      return 'buffer.writeUInt32LE(value, offset)'
    case 'DATE':
    case 'DATE_AND_TIME':
      return 'buffer.writeUInt32LE(value / 1000, offset)'
    case 'DINT':
      return 'buffer.writeInt32LE(value, offset)'
    case 'LWORD':
    case 'ULINT':
      return 'buffer.writeBigUInt64LE(value, offset)'
    case 'LINT':
      return 'buffer.writeBigInt64LE(value, offset)'
    case 'REAL':
      return 'buffer.writeFloatLE(value, offset)'
    case 'LREAL':
      return 'buffer.writeDoubleLE(value, offset)'
    case 'STRING':
      return `buffer.write(value.slice(0, ${size - 1}), offset, ${size} , \'ascii\')`
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

    let valueExpression = prefix
    let idx = 0

    while (idx < dimensions.length && begin[idx] === end[idx]) {
      valueExpression += `[${begin[idx]}]`
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
    string += `value = ${valueExpression}`
    for (let i = sameIndexUntil; i < dimensions.length; i++) 
      string += `[${indexNames[i]}]`
    string += '\n'

    string += `${renderWriteExpression(type, size)}\n`
    string += `offset += ${size}\n` 
    
    for (let i = sameIndexUntil; i < dimensions.length; i++) 
      string += '}\n'
  }

  return string
}

/**
 * Renders the block for writing the values in `target` object to defined packets
 */
function renderWriteStatement(definition: NvSegmentDefinition): string {
  let string = ''
  if (definition.isArray) {
    string += `${renderForStatement(definition)}\n`
  }
  else {
    string += `value = target['${definition.name}']\n`
    string += `${renderWriteExpression(definition.type, definition.size)}\n`
    string += `offset += ${definition.size}\n`
  }
  return string
}


/**
 * Compiles the function that emits packets according to the packet definition
 */
export function compilePacketEmitter(packet: NvPacket, listId: number): NvPacketEmitter {
  let fn = `let offset = ${PACKET_HEADER_SIZE}\n`
      + `let buffer = Buffer.alloc(${packet.size})\n`
      // Write header to buffer
      + `buffer.write('${NETVAR_PROTOCOL_ID}', ${OFFSET_PROTOCOL}, 'ascii')\n`
      + `buffer.writeUInt16LE(${listId}, ${OFFSET_LIST_ID})\n`
      + `buffer.writeUInt16LE(${packet.index}, ${OFFSET_PACKET_INDEX})\n`
      + `buffer.writeUInt16LE(${packet.variableCount}, ${OFFSET_VAR_COUNT})\n`
      + `buffer.writeUInt16LE(${packet.size}, ${OFFSET_PACKET_SIZE})\n`
      + `buffer.writeUInt32LE(counter, ${OFFSET_COUNTER})\n`
      + 'let value = 0\n'

  for (const definition of packet.definitions)
    fn += renderWriteStatement(definition)

  fn += 'return buffer\n'

  return new Function('target', 'counter', fn) as NvPacketEmitter
}
