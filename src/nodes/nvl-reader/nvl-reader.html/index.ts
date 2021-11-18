import { EditorRED } from 'node-red'
import { NvlReaderEditorNodeProperties } from './modules/types'

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
    // inProperty: {
    //   value: 'payload',
    //   required: true,
    // },
    // outProperty: {
    //   value: 'payload',
    //   required: true,
    // },
  },
  inputs: 1,
  outputs: 1,
  icon: 'codesys.svg',
  paletteLabel: 'nvl reader',
  label() {
    return this.name || 'nvl reader'
  },
  oneditprepare() {
    // $('#node-input-inProperty').typedInput({
    //   types: ['msg'],
    // })
    // $('#node-input-outProperty').typedInput({
    //   types: ['msg'],
    // })
  },
})
