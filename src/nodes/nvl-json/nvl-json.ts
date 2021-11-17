import { NodeInitializer } from 'node-red'
import rfdc from 'rfdc'
import { NvlConfigNode } from '../nvl-config/modules/types'
import { NvlJsonNode, NvlJsonNodeDef } from './modules/types'
import { buildNetworkVariableListJSON } from '../shared/util'

const clone = rfdc()

const nodeInit: NodeInitializer = (RED): void => {
  function NvlJsonNodeConstructor(
    this: NvlJsonNode,
    config: NvlJsonNodeDef,
  ): void {
    RED.nodes.createNode(this, config)

    this.nvl = RED.nodes.getNode(config.nvl) as NvlConfigNode
    this.template = {}

    if (this.nvl) 
      this.template = buildNetworkVariableListJSON(this.nvl.definitions)
    
    this.on('input', (msg, send, done) => {
      if (!this.nvl)
        return done(new TypeError('Network Variable List is not defined'))

      msg.payload = clone(this.template)
      send(msg)
      done()
    })
  }

  RED.nodes.registerType('nvl-json', NvlJsonNodeConstructor)
}


export = nodeInit
