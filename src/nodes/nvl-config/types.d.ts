import { Node, NodeDef } from 'node-red'
import { Nvl } from './modules/nvl'

export interface NvlConfigOptions {
  netvarListId: string
  netvarList: string
}

export interface NvlConfigNodeDef extends NodeDef, NvlConfigOptions {}

export interface NvlConfigNode extends Node {
  nvl: Nvl
}