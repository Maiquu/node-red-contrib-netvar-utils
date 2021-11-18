import { NvDefinition, NvType } from '../../shared/types'
/**
 * Generates a variable name that is all uppercase based on given number
 */
export function generateSafeVariableName(number: number) {
  const uppercaseLetterCount = 26
  const uppercaseFirst = 65

  number = Math.floor(number)
  if (number < 0)
    number = Number.MAX_SAFE_INTEGER + number
  if (number === 0)
    return 'A'

  const chars = []
  while (number > 0) {
    const value = number % uppercaseLetterCount
    chars.unshift(String.fromCharCode(uppercaseFirst + value))
    number -= value
    number /= uppercaseLetterCount
  }
  return chars.join('')
}


export interface ForStatementRange {
  begin: number[]
  end: number[]
}

/**
 * Get index ranges for looping over an array slice with given dimensions.
 */
export function getForStatementRanges(dimensions: number[], begin: number, end: number): ForStatementRange[] {
  /** Size array length plus one equals dimension array length */
  const sizes: number[] = []
  for (let i = 1; i < dimensions.length; i++) {
    sizes.push(dimensions.slice(i)
      .reduce((a, b) => a * b, 1))
  }

  const points: number[] = []
  points.push(begin)
  for (let i = sizes.length - 1; i > -1; i--) {
    const size = sizes[i]
    points.push(Math.ceil(begin / size) * size)
  }

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i]
    points.push(Math.floor(end / size) * size)
  }
  points.push(end)

  const volume = dimensions.reduce((a, b) => a * b)
  
  const getBeginIndexes = (value: number): number[] => {
    if (value < 0 || value > volume) 
      throw new Error(`cannot be less than 0, more than ${volume}`)
    if (value === 0) 
      return dimensions.map(() => 0)
    const indexes = []
    let remainder = value
    for (let i = 0; i < dimensions.length - 1; i++) {
      if (remainder > 0) {
        const size = sizes[i]
        const result = Math.floor(remainder / size)
        remainder = value % size
        indexes.push(result)
      }
      else {
        indexes.push(0)
      }
    }
    indexes.push(remainder)
    return indexes
  }

  const getEndIndexes = (value: number): number[] => {
    if (value < 0 || value > volume) 
      throw new Error(`cannot be less than 0, more than ${volume}`)
    if (value === volume) 
      return dimensions.slice(0)
    const indexes = []
    let remainder = value
    for (let i = 0; i < dimensions.length - 1; i++) {
      if (remainder > 0) {
        const size = sizes[i]
        const result = Math.floor(remainder / size)
        remainder = value % size
        indexes.push(remainder === 0 
          ? result - 1 
          : result)
      }
      else {
        indexes.push(dimensions[i])
      }
    }
    indexes.push(remainder || dimensions[dimensions.length - 1])
    return indexes
  }

  const ranges: ForStatementRange[] = []
  let lastPoint = points[0]
  for (let i = 1; i < points.length; i++) {
    const point = points[i]
    if (lastPoint !== point) {
      ranges.push({
        begin: getBeginIndexes(lastPoint),
        end: getEndIndexes(point),
      })
    }
    lastPoint = point
  }
  return ranges
}

/** Partial JSONSchema interface */
export interface JSONSchema {
  type?: 'null' | 'boolean' | 'string' | 'number' | 'integer' | 'object' | 'array'
  format?: string
  items?: JSONSchema | JSONSchema[]
  minItems?: number
  properties?: { [x: string]: JSONSchema }
}

export function buildJSONSchemaFromDefinitions(definitions: NvDefinition[]): JSONSchema {

  const schema: JSONSchema & Required<Pick<JSONSchema, 'properties'>> = {
    type: 'object',
    properties: {},
  }

  for (const definition of definitions) {
    if (definition.isArray) {
      const subschema: JSONSchema = {}
      let next = subschema
      for (const dimension of definition.dimensions) {
        next.type = 'array'
        next.minItems = dimension
        next = next.items = {}
      }
      Object.assign(next, getJSONSchemaOf(definition.type))
      schema.properties[definition.name] = subschema
    } 
    else {
      const subschema = getJSONSchemaOf(definition.type)
      schema.properties[definition.name] = subschema
    }
  }

  return schema
}

/** Get JSON Schema for given NVL Type. Based on https://github.com/fastify/fast-json-stringify#fastjsonstringifyschema */
function getJSONSchemaOf(type: NvType): JSONSchema {
  switch (type) {
    case 'BOOL':
      return { type: 'boolean' }
    case 'STRING':
      return { type: 'string' }
    case 'REAL':
    case 'LREAL':
      return { type: 'number' }
    default:
      return { type: 'integer' }
  }
}