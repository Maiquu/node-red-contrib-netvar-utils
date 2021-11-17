import { Node, NodeDef } from 'node-red'
import { NvlConfigOptions } from '../shared/types'
import { NvDefinition, NvPacket, NvPacketReader, NvPacketEmitter } from '../../shared/types'

export interface NvlConfigNodeDef extends NodeDef, NvlConfigOptions {}

export interface NvlConfigNode extends Node {
  definitions: NvDefinition[]
  expectedPackets: NvPacket[]
  readers: NvPacketReader[]
  emitters: NvPacketEmitter[]
}