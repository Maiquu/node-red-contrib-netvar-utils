# node-red-contrib-netvar-utils

This module provides set of utility nodes in [Node-RED](http://nodered.org) for creating, parsing NVL (Network Variable List) UDP packets.

## Nodes
- `nvl-json`: Outputs JSON object with falsy values based on the configured NVL.
- `nvl-reader`: Parses received NVL packets and returns the entire NVL as JSON object. Will only send output when it receives the last expected packet.
Outputed JSON object has the same structure as the one created via `nvl-json`.
- `nvl-emitter`: Outputs NVL packet(s) using given JSON object. Input JSON object **must** have the same structure as the ones outputed via `nvl-json` and `nvl-reader`.

> Created using [@alexk111](https://github.com/alexk111)'s [node-red template](https://github.com/alexk111/node-red-node-typescript-starter)

## TODO
- `BigInt`
- More detailed documentation for nodes
- Options to define how input is received and how output is delivered
- Tests

## License

MIT