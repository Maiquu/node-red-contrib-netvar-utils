/* eslint-disable */
// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function() {
  function id(x) { return x[0] }

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

  const grammar = {
    Lexer: lexer,
    ParserRules: [
      { name: 'Main$ebnf$1', symbols: [] },
      { name: 'Main$ebnf$1$subexpression$1', symbols: ['__', 'VariableDeclarationList'] },
      { name: 'Main$ebnf$1', symbols: ['Main$ebnf$1', 'Main$ebnf$1$subexpression$1'], postprocess: function arrpush(d) { return d[0].concat([d[1]]) } },
      { name: 'Main', symbols: ['_', 'VariableDeclarationList', 'Main$ebnf$1', '_'], postprocess: function Main(arr) {
        const first = arr[1]
        const rest = arr[2].flatMap(ebnf => ebnf[1])
        return [...first, ...rest]
      } },
      { name: 'VariableDeclarationList$ebnf$1', symbols: [] },
      { name: 'VariableDeclarationList$ebnf$1$subexpression$1', symbols: [(lexer.has('decorator') ? { type: 'decorator' } : decorator), '__'] },
      { name: 'VariableDeclarationList$ebnf$1', symbols: ['VariableDeclarationList$ebnf$1', 'VariableDeclarationList$ebnf$1$subexpression$1'], postprocess: function arrpush(d) { return d[0].concat([d[1]]) } },
      { name: 'VariableDeclarationList$ebnf$2', symbols: [] },
      { name: 'VariableDeclarationList$ebnf$2$subexpression$1', symbols: ['VariableDeclaration', '_'] },
      { name: 'VariableDeclarationList$ebnf$2', symbols: ['VariableDeclarationList$ebnf$2', 'VariableDeclarationList$ebnf$2$subexpression$1'], postprocess: function arrpush(d) { return d[0].concat([d[1]]) } },
      { name: 'VariableDeclarationList', symbols: [(lexer.has('begin') ? { type: 'begin' } : begin), '__', 'VariableDeclarationList$ebnf$1', 'VariableDeclarationList$ebnf$2', (lexer.has('end') ? { type: 'end' } : end)], postprocess: function VariableList(arr) {
        const declarations = arr[3]
        return declarations.map(dec => dec[0])
      } },
      { name: 'VariableDeclaration', symbols: [(lexer.has('word') ? { type: 'word' } : word), '_', (lexer.has('colon') ? { type: 'colon' } : colon), '_', 'Expression', '_', (lexer.has('semicolon') ? { type: 'semicolon' } : semicolon)], postprocess: function VariableDeclaration(arr) {
        const name = arr[0].value
        const expression = arr[4]
        return {
          name,
          ...expression,
        }
      } },
      { name: 'Expression', symbols: ['ArrayExpression'], postprocess: id },
      { name: 'Expression', symbols: ['StringExpression'], postprocess: id },
      { name: 'Expression', symbols: ['TypeExpression'], postprocess: id },
      { name: 'ArrayExpression', symbols: [(lexer.has('array') ? { type: 'array' } : array), '_', (lexer.has('lsquare') ? { type: 'lsquare' } : lsquare), '_', 'RangeElementList', '_', (lexer.has('rsquare') ? { type: 'rsquare' } : rsquare), '__', (lexer.has('of') ? { type: 'of' } : of), '__', 'Expression'], postprocess: function ArrayExpression(arr) {
        const expression = arr[10]
        const dimensions = arr[4]
        if (expression.isArray) 
          dimensions.push(...expression.dimensions)
          
        return {
          type: expression.type,
          size: expression.type === 'STRING'
            ? expression.size
            : getSizeOf(expression.type),
          isArray: true,
          dimensions,
        }
      } },
      { name: 'RangeElementList$ebnf$1$subexpression$1', symbols: ['_', (lexer.has('comma') ? { type: 'comma' } : comma), '_', 'RangeElementList'] },
      { name: 'RangeElementList$ebnf$1', symbols: ['RangeElementList$ebnf$1$subexpression$1'], postprocess: id },
      { name: 'RangeElementList$ebnf$1', symbols: [], postprocess(d) { return null } },
      { name: 'RangeElementList', symbols: ['RangeElement', 'RangeElementList$ebnf$1'], postprocess: function RangeElementList(arr) {
        const dimensions = [arr[0]]
        if (arr[1]) 
          dimensions.push(...arr[1][3])
          
        return dimensions
      } },
      { name: 'RangeElement', symbols: [(lexer.has('number') ? { type: 'number' } : number), '_', (lexer.has('between') ? { type: 'between' } : between), '_', (lexer.has('number') ? { type: 'number' } : number)], postprocess: function RangeElement(arr) {
        const from = Number(arr[0].value)
        const to = Number(arr[4].value)
        return to - from + 1
      } },
      { name: 'StringExpression$ebnf$1$subexpression$1', symbols: ['_', (lexer.has('lbracket') ? { type: 'lbracket' } : lbracket), '_', (lexer.has('number') ? { type: 'number' } : number), '_', (lexer.has('rbracket') ? { type: 'rbracket' } : rbracket)] },
      { name: 'StringExpression$ebnf$1', symbols: ['StringExpression$ebnf$1$subexpression$1'], postprocess: id },
      { name: 'StringExpression$ebnf$1', symbols: [], postprocess(d) { return null } },
      { name: 'StringExpression', symbols: [(lexer.has('string') ? { type: 'string' } : string), 'StringExpression$ebnf$1'], postprocess: function StringExpression(arr) {
        const size = arr[1]
          ? Number(arr[1][3]) + 1
          : getSizeOf('STRING')
        return {
          type: 'STRING',
          size,
          isArray: false,
        }
      } },
      { name: 'TypeExpression', symbols: [(lexer.has('type') ? { type: 'type' } : type)], postprocess: function TypeExpression(arr) {
        let type = arr[0].value
        // aliases
        if (type === 'TOD') 
          type = 'TIME_OF_DAY'
        else if (type === 'DT') 
          type = 'DATE_AND_TIME'
          
        return {
          type,
          size: getSizeOf(type),
          isArray: false,
        }
      } },
      { name: '_$ebnf$1', symbols: [(lexer.has('ws') ? { type: 'ws' } : ws)], postprocess: id },
      { name: '_$ebnf$1', symbols: [], postprocess(d) { return null } },
      { name: '_', symbols: ['_$ebnf$1'], postprocess: () => { return [] } },
      { name: '__', symbols: [(lexer.has('ws') ? { type: 'ws' } : ws)], postprocess: () => { return [] } },
    ],
    ParserStart: 'Main',
  }
  if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') 
    module.exports = grammar
  else 
    window.grammar = grammar

})()
