import type { EditorRED, EditorNodeProperties } from 'node-red'
import { NvlHeaderOptions } from '../options'

interface NvlHeaderEditorNodeProperties
  extends EditorNodeProperties,
  NvlHeaderOptions {}

declare const RED: EditorRED

RED.nodes.registerType<NvlHeaderEditorNodeProperties>('nvl-header', {
  category: 'codesys',
  color: '#a6bbcf',
  defaults: {
    name: { value: '' },
  },
  inputs: 1,
  outputs: 1,
  icon: 'codesys.svg',
  paletteLabel: 'nvl header',
  label() {
    return this.name || 'nvl header'
  },
})
