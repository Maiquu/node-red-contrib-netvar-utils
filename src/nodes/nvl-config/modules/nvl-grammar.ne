@{%
const moo = require('moo')
const byteSizes = {
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

function getSizeOf(type) {
  return byteSizes[type] || 0
}

const lexer = moo.states({
  main: {
    ws: { match: /\s+/, lineBreaks: true },
    colon: ':',
    semicolon: ';',
    lsquare: { match: '[', push: 'range' },
    lbracket: { match: '(', push: 'stringLength' },
    word: {
      match: /[a-zA-Z_]\w*/,
      type: moo.keywords({
        begin: 'VAR_GLOBAL',
        end: 'END_VAR',
        decorator: ['RETAIN', 'PERSISTENT'],
        string: 'STRING',
        array: 'ARRAY',
        of: 'OF',
        type: [
          'BOOL',
          'BYTE',
          'WORD',
          'DWORD',
          'LWORD', 
          'SINT', 
          'USINT', 
          'INT', 
          'UINT',
          'DINT',
          'UDINT',
          'LINT',
          'ULINT',
          'REAL',
          'LREAL',
          'TIME',
          'TIME_OF_DAY',
          'TOD',
          'DATE',
          'DATE_AND_TIME',
          'DT',
        ],
      }),
    },
  },
  range: {
    ws: /[ \t]+/,
    number: /[0-9]+/,
    between: '..',
    comma: ',',
    rsquare: { match: ']', pop: 1 },
  },
  stringLength: {
    ws: /[ \t]+/,
    number: /[0-9]+/,
    rbracket: { match: ')', pop: 1 },
  },
})

%}

@lexer lexer

# Returns list of all declared variables
Main -> _ VariableDeclarationList (__ VariableDeclarationList):* _
{% function Main(arr) {
  const first = arr[1]
  const rest = arr[2].flatMap(ebnf => ebnf[1])
  return [...first, ...rest]
}%}

VariableDeclarationList -> %begin __ (%decorator __):* (VariableDeclaration _):* %end
{% function VariableList(arr) {
  const declarations = arr[3]
  return declarations.map(dec => dec[0])
}%}

VariableDeclaration -> %word _ %colon _ Expression _ %semicolon 
{% function VariableDeclaration(arr) {
  const name = arr[0].value
  const expression = arr[4]
  return {
    name,
    ...expression
  }
}%}

Expression ->
  ArrayExpression {% id %}
| StringExpression {% id %}
| TypeExpression {% id %}


ArrayExpression -> %array _ %lsquare _ RangeElementList _ %rsquare __ %of __ Expression
{% function ArrayExpression(arr) {
  const expression = arr[10]
  const dimensions = arr[4]
  if (expression.isArray) {
    dimensions.push(...expression.dimensions)
  }
  return {
    type: expression.type,
    size: expression.type === 'STRING'
      ? expression.size
      : getSizeOf(expression.type),
    isArray: true,
    dimensions,
  }
}%}

RangeElementList -> RangeElement (_ %comma _ RangeElementList):?
{% function RangeElementList(arr) {
  const dimensions = [arr[0]]
  if (arr[1]) {
    dimensions.push(...arr[1][3])
  }
  return dimensions
}%}

RangeElement ->  %number _ %between _ %number
{% function RangeElement(arr) {
  const from = Number(arr[0].value)
  const to = Number(arr[4].value)
  return to - from + 1
}%}

StringExpression -> %string (_ %lbracket _ %number _ %rbracket):? 
{% function StringExpression(arr) {
  const size = arr[1]
    ? Number(arr[1][3]) + 1
    : getSizeOf('STRING')
  return {
    type: 'STRING',
    size,
    isArray: false,
  }
}%}

TypeExpression -> %type
{% function TypeExpression(arr) {
  let type = arr[0].value
  // aliases
  if (type === 'TOD') {
    type = 'TIME_OF_DAY'
  } else if (type === 'DT') {
    type = 'DATE_AND_TIME'
  }
  return {
    type,
    size: getSizeOf(type),
    isArray: false
  }
}%}

_ -> %ws:? {% () => { return [] } %}
__ -> %ws {% () => { return [] } %}