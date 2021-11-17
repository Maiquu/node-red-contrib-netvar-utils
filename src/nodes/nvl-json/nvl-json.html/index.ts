import { EditorRED } from 'node-red'
import { NvlJsonEditorNodeProperties } from './modules/types'

declare const RED: EditorRED

RED.nodes.registerType<NvlJsonEditorNodeProperties>('nvl-json', {
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
  icon: 'file.png',
  paletteLabel: 'nvl json',
  label() {
    return this.name || 'nvl json'
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
