import { Node, NodeDef, NodeInitializer } from 'node-red'
import { NvlConfigNode } from '../nvl-config/types'
import { NvlJsonOptions } from './options'

interface NvlJsonNodeDef extends NodeDef, NvlJsonOptions {}

interface NvlJsonNode extends Node {
  nvl?: NvlConfigNode
  template: Record<string, any>
}

const nodeInit: NodeInitializer = (RED): void => {
  function NvlJsonNodeConstructor(
    this: NvlJsonNode,
    config: NvlJsonNodeDef,
  ): void {
    RED.nodes.createNode(this, config)

    const nvl = (RED.nodes.getNode(config.nvl) as NvlConfigNode | undefined)?.nvl

    this.on('input', (msg, send, done) => {
      if (!nvl)
        return done(new TypeError('Network Variable List is not defined or invalid.'))

      msg.payload = nvl.createEmptyJSON()
      send(msg)
      done()
    })
  }

  RED.nodes.registerType('nvl-json', NvlJsonNodeConstructor)
}


export = nodeInit
