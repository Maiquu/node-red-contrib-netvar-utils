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
      if (!msg.payload || typeof msg.payload !== 'object')
        return done(new TypeError('Expect payload to be object'))
      
      let packets: Buffer[] = []
      try {
        packets = this.nvl.emitters.map(emitter => 
          emitter(msg.payload as Record<string, any>, counter),
        )
      }
      catch (err) {
        this.error(err)
        return done(new Error('Error while creating netvar buffer(s), did you forget to initialise netvar json?'))
      }

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
