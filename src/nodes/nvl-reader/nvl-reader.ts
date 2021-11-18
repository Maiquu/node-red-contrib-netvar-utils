import { NodeInitializer } from 'node-red'
import { NvlConfigNode } from '../nvl-config/modules/types'
import { NvlReaderNode, NvlReaderNodeDef } from './modules/types'

const nodeInit: NodeInitializer = (RED): void => {
  function NvlEmitterNodeConstructor(
    this: NvlReaderNode,
    config: NvlReaderNodeDef,
  ): void {
    RED.nodes.createNode(this, config)

    this.nvl = RED.nodes.getNode(config.nvl) as NvlConfigNode

    let payload: Record<string, any> | undefined

    this.on('input', (msg, send, done) => {
      if (!this.nvl)
        return done(new TypeError('Network Variable List is not defined'))
      if (!(msg.payload instanceof Buffer))
        return done(new TypeError('Expected payload to be Buffer'))
      if (!this.nvl.isExpectedPacket(msg.payload))
        return done()
      
      const { nvl } = this
      const packet = msg.payload
      if (nvl.isFirstPacket(packet))
        payload = nvl.buildNetvarJSON()
      
      if (payload) {
        nvl.readPacket(payload, packet)
        if (nvl.isLastPacket(packet)) {
          send({ payload })
          payload = undefined
        }
      }

      done()
    })
  }

  RED.nodes.registerType('nvl-reader', NvlEmitterNodeConstructor)
}

export = nodeInit
