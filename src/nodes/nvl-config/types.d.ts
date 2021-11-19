import { Node, NodeDef } from 'node-red'
import { ValidateFunction } from 'ajv'

export interface NvlConfigOptions {
  projectId: string
  netvarListId: string
  netvarList: string
}

export interface NvlConfigNodeDef extends NodeDef, NvlConfigOptions {}

export interface NvlConfigNode extends Node {
  buildNetvarJSON: () => Record<string, any>
  validateNetvarJSON: ValidateFunction<Record<string, any>>
  isExpectedPacket: (packet: Buffer) => boolean
  isFirstPacket: (packet: Buffer) => boolean
  isLastPacket: (packet: Buffer) => boolean
  readPacket: (target: Record<string, any>, packet: Buffer) => void
  emitPackets: (target: Record<string, any>, counter: number) => Buffer[]
}