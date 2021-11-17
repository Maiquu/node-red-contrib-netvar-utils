import { Node, NodeDef } from 'node-red'
import { NvlConfigNode } from 'src/nodes/nvl-config/modules/types'
import { NvlEmitterOptions } from '../shared/types'

export interface NvlEmitterNodeDef extends NodeDef, NvlEmitterOptions {}

export interface NvlEmitterNode extends Node {
  nvl?: NvlConfigNode
  template: Record<string, any>
}

