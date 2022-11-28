import { Node, NodeDef, NodeInitializer } from 'node-red'
import { readPacketHeader } from '../shared/util'
import { NvlHeaderOptions } from './options'

interface NvlHeaderNodeDef extends NodeDef, NvlHeaderOptions {}

interface NvlHeaderNode extends Node {}

const nodeInit: NodeInitializer = (RED): void => {
  function NvlHeaderNodeConstructor(
    this: NvlHeaderNode,
    config: NvlHeaderNodeDef,
  ): void {
    RED.nodes.createNode(this, config)

    this.on('input', (msg, send, done) => {
      if (!(msg.payload instanceof Buffer))
        return done(new TypeError('Expected payload to be Buffer.'))

      msg.payload = readPacketHeader(msg.payload)
      send(msg)
      done()
    })
  }

  RED.nodes.registerType('nvl-header', NvlHeaderNodeConstructor)
}

export = nodeInit
