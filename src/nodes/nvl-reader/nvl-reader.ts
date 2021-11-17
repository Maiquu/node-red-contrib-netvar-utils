import rfdc from 'rfdc'
import { NodeInitializer } from 'node-red'
import { NvlConfigNode } from '../nvl-config/modules/types'
import { buildNetworkVariableListJSON, readPacketIndex } from '../shared/util'
import { NvlReaderNode, NvlReaderNodeDef } from './modules/types'
import { PACKET_HEADER_SIZE } from '../shared/constants'

const clone = rfdc()

const nodeInit: NodeInitializer = (RED): void => {
  function NvlEmitterNodeConstructor(
    this: NvlReaderNode,
    config: NvlReaderNodeDef,
  ): void {
    RED.nodes.createNode(this, config)

    this.nvl = RED.nodes.getNode(config.nvl) as NvlConfigNode
    this.template = {}
    if (this.nvl) 
      this.template = buildNetworkVariableListJSON(this.nvl.definitions)

    let payload: Record<string, any> | undefined

    this.on('input', (msg, send, done) => {
      if (!this.nvl)
        return done(new TypeError('Network Variable List is not defined'))
      if (!(msg.payload instanceof Buffer))
        return done(new TypeError('Expected payload to be Buffer'))
      if (msg.payload.length < PACKET_HEADER_SIZE)
        return done()
        
      const index = readPacketIndex(msg.payload)
      const reader = this.nvl.readers[index]
      if (index === 0)
        payload = clone(this.template)
      
      if (payload && reader)
        reader(payload, msg.payload)
      
      if (index === this.nvl.expectedPackets.length - 1) {
        msg.payload = payload
        send(msg)   
      }
    
      done()
    })
  }

  RED.nodes.registerType('nvl-reader', NvlEmitterNodeConstructor)
}

export = nodeInit
