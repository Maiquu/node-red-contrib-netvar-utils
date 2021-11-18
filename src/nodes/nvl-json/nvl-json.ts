import { NodeInitializer } from 'node-red'
import rfdc from 'rfdc'
import { NvlConfigNode } from '../nvl-config/modules/types'
import { NvlJsonNode, NvlJsonNodeDef } from './modules/types'

const clone = rfdc()

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

      msg.payload = clone(this.nvl.json)
      send(msg)
      done()
    })
  }

  RED.nodes.registerType('nvl-json', NvlJsonNodeConstructor)
}


export = nodeInit
