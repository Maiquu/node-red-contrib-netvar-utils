import { NodeInitializer } from 'node-red'
import { NvlConfigNode } from '../nvl-config/modules/types'
import { NvlEmitterNode, NvlEmitterNodeDef } from './modules/types'

const nodeInit: NodeInitializer = (RED): void => {
  function NvlEmitterNodeConstructor(
    this: NvlEmitterNode,
    config: NvlEmitterNodeDef,
  ): void {
    RED.nodes.createNode(this, config)

    this.nvl = RED.nodes.getNode(config.nvl) as NvlConfigNode
    this.template = {}

    let counter = 0

    this.on('input', (msg, send, done) => {
      if (!this.nvl)
        return done(new TypeError('Network Variable List is not defined'))
      if (typeof msg.payload !== 'object')
        return done(new TypeError('Expect payload to be object'))
      
      const packets = this.nvl.emitters.map(emitter => 
        emitter(msg.payload as Record<string, any>, counter),
      )
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
