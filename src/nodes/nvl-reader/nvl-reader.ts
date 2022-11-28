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

interface NodeMessageStats extends NodeMessageInFlow {
  stats: NvlReadStats
}

interface NvlReadStats {
  start: Date
  end: Date
  duration: number
  timeout: boolean
  missing: number[]
}

interface NvlReadContext {
  send: debounce<(msg: NodeMessageInFlow, timeout: boolean) => void>
  payload: Record<string, any>
  packets: boolean[]
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
  const start = new Date()
  let messageSent = false
  const debouncedSend = debounce(config.timeout || DEFAULT_TIMEOUT, (msg: NodeMessageInFlow, timeout: boolean) => {
    const end = new Date()
    const duration = end.getTime() - start.getTime()
    const msgWithStats = util.cloneMessage(msg) as NodeMessageStats
    msgWithStats.stats = {
      start,
      end,
      duration,
      timeout,
      missing: packets.reduce((acc, received, index) => {
        if (!received)
          acc.push(index)
        return acc
      }, [] as number[]),
    }

    if (!messageSent) {
      messageSent = true
      if (!timeout || (timeout && config.timeoutBehaviour === 'send')) {
        msg.payload = payload
        send([msg, msgWithStats])
        onSend()
      }
      else {
        send([null, msgWithStats])
        onSend()
      }
    }
  })

  return {
    send: debouncedSend,
    payload,
    packets,
  }
}

function createLastPacketListener(
  node: NvlReaderNode,
  config: NvlReaderNodeDef,
  nvl: Nvl,
) {
  let context: NvlReadContext | null = null
  const listener: NodeInputListener = (msg, send, done) => {

    if (!(msg.payload instanceof Buffer))
      return done(new TypeError('Expected payload to be Buffer.'))
    if (!nvl.isExpectedPacket(msg.payload))
      return done()
    if (!context) {
      context = createReadContext(config, nvl, send, () => {
        context = null
      })
    }

    const packet = msg.payload
    const index = readPacketIndex(msg.payload)

    context.packets[index] = true

    nvl.readPacket(context.payload, packet)
    context.send(msg, true)
    if (context.packets.every(v => v)) {
      context.send.cancel({ upcomingOnly: true })
      context.send(msg, false)
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
