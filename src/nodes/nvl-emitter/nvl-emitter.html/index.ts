import { EditorRED, EditorNodeProperties } from 'node-red'
import { NvlEmitterOptions } from '../options'

interface NvlEmitterEditorNodeProperties
  extends EditorNodeProperties,
  NvlEmitterOptions {}

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
  icon: 'codesys.svg',
  paletteLabel: 'nvl emitter',
  label() {
    return this.name || 'nvl emitter'
  },
})
