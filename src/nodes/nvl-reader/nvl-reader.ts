import { Node, NodeDef, NodeInitializer } from 'node-red'
import { NvlConfigNode } from '../nvl-config/types'
import { NvlReaderOptions } from './options'

interface NvlReaderNodeDef extends NodeDef, NvlReaderOptions {}

interface NvlReaderNode extends Node {
  nvl?: NvlConfigNode
  template: Record<string, any>
}

const nodeInit: NodeInitializer = (RED): void => {
  function NvlEmitterNodeConstructor(
    this: NvlReaderNode,
    config: NvlReaderNodeDef,
  ): void {
    RED.nodes.createNode(this, config)

    this.nvl = RED.nodes.getNode(config.nvl) as NvlConfigNode
    
    const emitOnLastPacket = config.emitOn === 'last-packet'

    let payload: Record<string, any> | null = null

    this.on('input', (msg, send, done) => {
      if (!this.nvl)
        return done(new TypeError('Network Variable List is not defined'))
      if (!(msg.payload instanceof Buffer))
        return done(new TypeError('Expected payload to be Buffer'))
      if (!this.nvl.isExpectedPacket(msg.payload))
        return done()
        
      const { nvl } = this
      const packet = msg.payload
      
      if (emitOnLastPacket) {
        if (nvl.isFirstPacket(packet))
          payload = nvl.buildNetvarJSON()
          
        if (payload) {
          nvl.readPacket(payload, packet)
          if (nvl.isLastPacket(packet)) {
            msg.payload = payload
            send(msg)
            payload = null
          }
        }
        done()
      }
      else {
        RED.util.evaluateNodeProperty(config.initial, config.initialType, this, msg, (err, value) => {
          if (value) {
            if (!nvl.validateNetvarJSON(value)) {
              this.error(nvl.validateNetvarJSON.errors)
              return done(new TypeError('Bad JSON payload. See previous log for information'))
            }
            nvl.readPacket(value, packet)
            msg.payload = value
          }
          else {
            if (err) 
              this.warn(`${err.message}. Using JSON with empty values.`)
            
            const payload = nvl.buildNetvarJSON()
            nvl.readPacket(payload, packet)
            msg.payload = payload
          }
          send(msg)
          done()
        })
      }
    })
  }

  RED.nodes.registerType('nvl-reader', NvlEmitterNodeConstructor)
}



export = nodeInit
