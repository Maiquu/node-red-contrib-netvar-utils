import { Node, NodeDef } from 'node-red'
import { NvlConfigNode } from 'src/nodes/nvl-config/modules/types'
import { NvlJsonOptions } from '../shared/types'

export interface NvlJsonNodeDef extends NodeDef, NvlJsonOptions {}

export interface NvlJsonNode extends Node {
  nvl?: NvlConfigNode
  template: Record<string, any>
}

