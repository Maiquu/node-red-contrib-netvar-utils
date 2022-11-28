import { Node, NodeDef, NodeInitializer, NodeMessage, NodeMessageInFlow } from 'node-red'
import { NvlConfigNode } from '../nvl-config/types'
import { NvlReaderOptions } from './options'
import { debounce } from 'throttle-debounce'
import { readPacketIndex } from '../shared/util'
import { util } from 'node-red'
import { Nvl } from '../nvl-config/modules/nvl'

interface NvlReaderNodeDef extends NodeDef, NvlReaderOptions {}

interface NvlReaderNode extends Node {
  nvl?: NvlConfigNode
  template: Record<string, any>
}

interface NodeMessageWithStats extends NodeMessage {
  stats: NvlReadStats
}

interface NvlReadStats {
  start: number
  end: number
  duration: number
  timeout: boolean
  validPacketsReceived: number
  invalidPacketsReceived: number
  missingPackets: number[]
}

interface NvlReadContext {
  send: (msg: NodeMessageInFlow, timeout: boolean) => void
  debouncedSend: debounce<(msg: NodeMessageInFlow, timeout: boolean) => void>
  payload: Record<string, any>
  packets: boolean[]
  counter: number
  invalidPacketCounter: number
}

type NodeInputListener = (
  msg: NodeMessageInFlow,
  send: (msg: NodeMessage | Array<NodeMessage | NodeMessage[] | null>) => void,
  done: (err?: Error) => void
) => void

const DEFAULT_TIMEOUT = 100

const nodeInit: NodeInitializer = (RED): void => {
  function NvlEmitterNodeConstructor(
    this: NvlReaderNode,
    config: NvlReaderNodeDef,
  ): void {
    RED.nodes.createNode(this, config)

    const nvl = (RED.nodes.getNode(config.nvl) as NvlConfigNode | undefined)?.nvl
    if (!nvl)
      throw new TypeError('Network Variable List is not defined or invalid.')

    const listener = config.emitOn === 'last-packet'
      ? createLastPacketListener(this, config, nvl)
      : createEveryPacketListener(this, config, nvl)

    this.on('input', listener)
  }

  RED.nodes.registerType('nvl-reader', NvlEmitterNodeConstructor)
}

function createReadContext(
  config: NvlReaderNodeDef,
  nvl: Nvl,
  send: (msg: NodeMessage | Array<NodeMessage | NodeMessage[] | null>) => void,
  onSend: () => void,
): NvlReadContext {
  const payload = nvl.createEmptyJSON()
  const packets = Array(nvl.getExpectedPacketCount()).fill(false) as boolean[]

  let messageSent = false

  /* @ts-ignore-next-line */
  const context: NvlReadContext = {
    payload,
    packets,
    counter: 0,
    invalidPacketCounter: 0,
  }

  if (config.sendStats) {
    const start = new Date().getTime()
    context.send = (msg, timeout) => {
      const end = new Date().getTime()
      const duration = end - start
      const msgWithStats = util.cloneMessage(msg) as NodeMessageWithStats

      msgWithStats.stats = {
        start,
        end,
        duration,
        timeout,
        validPacketsReceived: context.counter,
        invalidPacketsReceived: context.invalidPacketCounter,
        missingPackets: packets.reduce((acc, received, index) => {
          if (!received)
            acc.push(index)
          return acc
        }, [] as number[]),
      }

      if (!messageSent) {
        messageSent = true
        if (!timeout || (timeout && config.timeoutBehaviour === 'send')) {
          msgWithStats.payload = payload
          send(msgWithStats)
          onSend()
        }
        else {
          msgWithStats.payload = null
          send(msgWithStats)
          onSend()
        }
      }
    }
  }
  else {
    context.send = (msg, timeout) => {
      if (!messageSent) {
        messageSent = true
        if (!timeout || (timeout && config.timeoutBehaviour === 'send')) {
          msg.payload = payload
          send(msg)
          onSend()
        }
      }
    }
  }

  context.debouncedSend = debounce(config.timeout || DEFAULT_TIMEOUT, context.send)

  return context as NvlReadContext
}

function createLastPacketListener(
  node: NvlReaderNode,
  config: NvlReaderNodeDef,
  nvl: Nvl,
) {
  let context: NvlReadContext | null = null
  const expectedPacketCount = nvl.getExpectedPacketCount()
  
  const listener: NodeInputListener = (msg, send, done) => {

    if (!(msg.payload instanceof Buffer))
      return done(new TypeError('Expected payload to be Buffer.'))
    if (!context) {
      context = createReadContext(config, nvl, send, () => {
        context = null
      })
    }
    if (!nvl.isExpectedPacket(msg.payload)) {
      context.invalidPacketCounter++
      return done()
    }

    const packet = msg.payload
    const index = readPacketIndex(msg.payload)

    if (!context.packets[index]) {
      context.packets[index] = true
      context.counter++
      nvl.readPacket(context.payload, packet)
      context.debouncedSend(msg, true)

      if (context.counter >= expectedPacketCount && context.packets.every(v => v)) {
        context.debouncedSend.cancel()
        context.send(msg, false)
      }
    }
    
    done()
  }
  return listener
}

function createEveryPacketListener(
  node: NvlReaderNode,
  config: NvlReaderNodeDef,
  nvl: Nvl,
) {
  const listener: NodeInputListener = (msg, send, done) => {
    if (!(msg.payload instanceof Buffer))
      return done(new TypeError('Expected payload to be Buffer.'))
    if (!nvl.isExpectedPacket(msg.payload))
      return done()

    const packet = msg.payload

    util.evaluateNodeProperty(config.initial, config.initialType, node, msg, (err, value) => {
      if (value) {
        if (!nvl.validateJSON(value)) {
          node.error(nvl.validateJSON.errors)
          return done(new TypeError('Bad JSON payload. See previous log for information.'))
        }
        nvl.readPacket(value, packet)
        msg.payload = value
      }
      else {
        if (err) 
          node.warn(`${err.message}. Using JSON with empty values.`)
          
        const payload = nvl.createEmptyJSON()
        nvl.readPacket(payload, packet)
        msg.payload = payload
      }
      send(msg)
      done()
    })
  }
  return listener
}

export = nodeInit
