import type { NodeInitializer } from 'node-red'
import { NvlConfigNode, NvlConfigNodeDef } from './types'
import { Nvl } from './modules/nvl'


const nodeInit: NodeInitializer = (RED): void => {
  function NvlConfigNodeConstructor(this: NvlConfigNode, config: NvlConfigNodeDef): void {
    RED.nodes.createNode(this, config)
    this.nvl = new Nvl(this, config)
  }

  RED.nodes.registerType('nvl-config', NvlConfigNodeConstructor)
}

export = nodeInit
