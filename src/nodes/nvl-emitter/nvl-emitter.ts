import type { Node, NodeDef, NodeInitializer } from 'node-red'
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

    const nvl = (RED.nodes.getNode(config.nvl) as NvlConfigNode | undefined)?.nvl
    let counter = 0

    this.on('input', (msg, send, done) => {
      if (!nvl)
        return done(new TypeError('Network Variable List is not defined or invalid.'))
        
      const { payload } = msg
      if (!nvl.validateJSON(payload)) {
        this.error(nvl.validateJSON.errors)
        return done(new TypeError('Bad JSON payload. See previous log for information.'))
      }

      const packets = nvl.emitPackets(payload, counter)
      counter += nvl.getExpectedPacketCount()
      packets.forEach((packet) => {
        send({ payload: packet })
      })
      done()
    })
  }

  RED.nodes.registerType('nvl-emitter', NvlEmitterNodeConstructor)
}

export = nodeInit
