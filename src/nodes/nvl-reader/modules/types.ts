import { Node, NodeDef } from 'node-red'
import { NvlConfigNode } from 'src/nodes/nvl-config/modules/types'
import { NvlReaderOptions } from '../shared/types'

export interface NvlReaderNodeDef extends NodeDef, NvlReaderOptions {}

export interface NvlReaderNode extends Node {
  nvl?: NvlConfigNode
  template: Record<string, any>
}

