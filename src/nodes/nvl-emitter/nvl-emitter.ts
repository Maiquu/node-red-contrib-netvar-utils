import { Node, NodeDef, NodeInitializer } from 'node-red'
import { NvlConfigNode } from '../nvl-config/types'
import { NvlEmitterOptions } from './options'

interface NvlEmitterNodeDef extends NodeDef, NvlEmitterOptions {}

interface NvlEmitterNode extends Node {
  nvl?: NvlConfigNode
  template: Record<string, any>
}

const nodeInit: NodeInitializer = (RED): void => {
  function NvlEmitterNodeConstructor(
    this: NvlEmitterNode,
    config: NvlEmitterNodeDef,
  ): void {
    RED.nodes.createNode(this, config)

    this.nvl = RED.nodes.getNode(config.nvl) as NvlConfigNode
    let counter = 0

    this.on('input', (msg, send, done) => {
      if (!this.nvl)
        return done(new TypeError('Network Variable List is not defined'))
        
      const nvl = this.nvl
      const { payload } = msg
      if (!nvl.validateNetvarJSON(payload)) {
        this.error(nvl.validateNetvarJSON.errors)
        return done(new TypeError('Bad JSON payload. See previous log for information'))
      }

      const packets = nvl.emitPackets(payload, counter)
      counter++
      packets.forEach((packet) => {
        send({ payload: packet })
      })
      done()
    })
  }

  RED.nodes.registerType('nvl-emitter', NvlEmitterNodeConstructor)
}

export = nodeInit
