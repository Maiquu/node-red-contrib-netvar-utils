import { EditorRED, EditorNodeProperties, EditorWidgetTypedInputType } from 'node-red'
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
    emitOn: {
      value: 'last-packet',
      required: true,
    },
    initial: { value: 'topic' },
    initialType: { value: 'msg' },
    timeout: {
      value: 100,
      validate: RED.validators.number(true),
    },
    timeoutBehaviour: {
      value: 'send',
      required: true,
    },
    sendStats: {
      value: false,
    },
  },
  inputs: 1,
  outputs: 1,
  icon: 'codesys.svg',
  paletteLabel: 'nvl reader',
  label() {
    return this.name || 'nvl reader'
  },
  oneditprepare() {
    $('#node-input-emitOn').on('change', function() {
      const value = $(this).val()
      $('.node-row-timeout').toggle(value === 'last-packet')
      $('.node-row-initial').toggle(value === 'every-packet')
    })
    $('#node-input-initial').typedInput({
      types: ['msg', 'flow', 'global'],
      typeField: '#node-input-initial-type',
      default: this.initialType || 'msg',
    })
  },
  oneditsave() {
    this.initialType = $('#node-input-initial').typedInput('type') as EditorWidgetTypedInputType
  },
})
