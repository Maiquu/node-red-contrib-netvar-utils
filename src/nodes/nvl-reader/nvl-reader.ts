import { Node, NodeDef, NodeInitializer, NodeMessageInFlow } from 'node-red'
import { NvlConfigNode } from '../nvl-config/types'
import { NvlReaderOptions } from './options'
import { debounce } from 'throttle-debounce'

interface NvlReaderNodeDef extends NodeDef, NvlReaderOptions {}

interface NvlReaderNode extends Node {
  nvl?: NvlConfigNode
  template: Record<string, any>
}

const DEFAULT_TIMEOUT = 100

const nodeInit: NodeInitializer = (RED): void => {
  function NvlEmitterNodeConstructor(
    this: NvlReaderNode,
    config: NvlReaderNodeDef,
  ): void {
    RED.nodes.createNode(this, config)

    this.nvl = RED.nodes.getNode(config.nvl) as NvlConfigNode
    
    const nvl = this.nvl
    const emitOnLastPacket = config.emitOn === 'last-packet'
    const expectedPacketCount = nvl?.getExpectedPacketCount() || 0

    let payload = nvl?.buildNetvarJSON()
    let sendFn: debounce<(msg: NodeMessageInFlow, timeout: boolean) => void> | null = null
    let counter = 0

    this.on('input', (msg, send, done) => {
      if (!nvl)
        return done()
      if (!(msg.payload instanceof Buffer))
        return done(new TypeError('Expected payload to be Buffer'))
      if (!nvl.isExpectedPacket(msg.payload))
        return done()
      if (!sendFn) {
        sendFn = debounce(config.timeout || DEFAULT_TIMEOUT, (msg: NodeMessageInFlow, timeout: boolean) => {
          if (!timeout || (timeout && config.timeoutBehaviour === 'send')) {
            msg.payload = payload
            send(msg)
          }
          counter = 0
          payload = nvl.buildNetvarJSON()
          sendFn = null
        })
      }
        
      const packet = msg.payload
      
      if (emitOnLastPacket) {
        nvl.readPacket(payload, packet)
        counter++
        sendFn(msg, true)
        if (counter === expectedPacketCount) {
          sendFn.cancel({ upcomingOnly: true })
          sendFn(msg, false)
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
