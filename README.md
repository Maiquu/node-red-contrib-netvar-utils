# node-red-contrib-netvar-utils

This module provides set of utility nodes in [Node-RED](http://nodered.org) for creating, parsing NVL (Network Variable List) UDP packets. Supports NVL of any size.

> Created using [@alexk111](https://github.com/alexk111)'s [node-red template](https://github.com/alexk111/node-red-node-typescript-starter)

## Nodes

### `nvl-json`

Outputs JSON object with falsy values based on the configured NVL.

### `nvl-reader`

Parses received NVL packets and returns the entire NVL as JSON object.
Can be configured to emit message on each received packet or only when last expected packet is received.
Currently `nvl-reader` will silently omit invalid packets.

### `nvl-emitter`

Outputs NVL packet(s) using given JSON object. Input JSON object **must** have the same structure as the ones outputed via `nvl-json` and `nvl-reader`.

## Example

### JSON Structure
```
VAR_GLOBAL
  flag: BOOL;
  counter: WORD;
  message: STRING(50);
  wordArray: ARRAY [1..5] OF WORD;
  timeMatrix: ARRAY [1..2] OF ARRAY [1..3] OF WORD;
  threeD: ARRAY [0..1, 0..1, 0..1] OF WORD;
END_VAR 
```
will be converted to:
```json
{
  "flag": false,
  "counter": 0,
  "message": "",
  "wordArray": [0,0,0,0,0],
  "timeMatrix": [
    [0,0,0],
    [0,0,0]
  ],
  "threeD": [
    [[0,0], [0,0]],
    [[0,0], [0,0]]
  ]
}
```

## Supported Data Types

- ARRAY
- STRING
- BOOL
- BYTE, WORD, DWORD
- USINT, UINT, UDINT
- SINT, INT, DINT
- ULINT, LWORD, LINT
- TIME, TOD, TIME_OF_DAY
- DT, DATE_AND_TIME, DATE
- REAL, LREAL

## TODO
- `BigInt`
- More detailed documentation for nodes
- Options to define how input is received and how output is delivered
- `STRUCT`
- Dynamic network variable lists
- Tests
- Usage Examples

## License

MIT
