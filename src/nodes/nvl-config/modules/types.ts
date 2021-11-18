import { Node, NodeDef } from 'node-red'
import { NvlConfigOptions } from '../shared/types'
import { NvDefinition, NvPacket, NvPacketReader, NvPacketEmitter } from '../../shared/types'

export interface NvlConfigNodeDef extends NodeDef, NvlConfigOptions {}

export interface NvlConfigNode extends Node {
  definitions: NvDefinition[]
  json: Readonly<Record<string, any>>
  expectedPackets: NvPacket[]
  readers: NvPacketReader[]
  emitters: NvPacketEmitter[]
}