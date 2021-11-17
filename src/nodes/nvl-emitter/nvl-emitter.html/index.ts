import { EditorRED } from 'node-red'
import { NvlEmitterEditorNodeProperties } from './modules/types'

declare const RED: EditorRED

RED.nodes.registerType<NvlEmitterEditorNodeProperties>('nvl-emitter', {
  category: 'codesys',
  color: '#a6bbcf',
  defaults: {
    name: { value: '' },
    nvl: {
      value: '',
      type: 'nvl-config', 
      required: true, 
    },
  },
  inputs: 1,
  outputs: 1,
  icon: 'file.png',
  paletteLabel: 'nvl emitter',
  label() {
    return this.name || 'nvl emitter'
  },
})
