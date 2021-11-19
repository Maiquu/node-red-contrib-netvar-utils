import { EditorRED, EditorNodeProperties } from 'node-red'
import { NvlReaderOptions } from '../options'

interface NvlReaderEditorNodeProperties
  extends EditorNodeProperties,
  NvlReaderOptions {}

declare const RED: EditorRED

RED.nodes.registerType<NvlReaderEditorNodeProperties>('nvl-reader', {
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
  paletteLabel: 'nvl reader',
  label() {
    return this.name || 'nvl reader'
  },
})
