# node-red-contrib-netvar-utils

This module provides set of utility nodes in [Node-RED](http://nodered.org) for creating, parsing NVL (Network Variable List) UDP packets.

## Nodes
- `nvl-json`: Outputs JSON object with falsy values based on the configured NVL.
- `nvl-reader`: Parses received NVL packets and returns the entire NVL as JSON object. Will only send output when it receives the last expected packet.
Outputed JSON object has the same structure as the one created via `nvl-json`.
- `nvl-emitter`: Outputs NVL packet(s) using given JSON object. Input JSON object **must** have the same structure as the ones outputed via `nvl-json` and `nvl-reader`.

> Created using [@alexk111](https://github.com/alexk111)'s [node-red template](https://github.com/alexk111/node-red-node-typescript-starter)

## Example

### JSON Structure
```
VAR_GLOBAL
  flag: BOOL;
  counter: WORD;
  message: STRING(50);
  wordArray: ARRAY OF [1..5] OF WORD;
  timeMatrix: Array OF [1..2] OF ARRAY [1..3] OF WORD;
  threeD: Array OF [0..1, 0..1, 0..1] OF WORD;
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

https://github.com/Maiquu/node-red-contrib-netvar-utils/blob/e7a1abb9e9e802938581f19a3a0f66b8598b7195/src/nodes/shared/types.d.ts#L58

## TODO
- `BigInt`
- More detailed documentation for nodes
- Options to define how input is received and how output is delivered
- `STRUCT`
- Tests

## License

MIT