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

    this.nvl = RED.nodes.getNode(config.nvl) as NvlConfigNode

    this.on('input', (msg, send, done) => {
      if (!this.nvl)
        return done(new TypeError('Network Variable List is not defined'))

      msg.payload = this.nvl.buildNetvarJSON()
      send(msg)
      done()
    })
  }

  RED.nodes.registerType('nvl-json', NvlJsonNodeConstructor)
}


export = nodeInit
