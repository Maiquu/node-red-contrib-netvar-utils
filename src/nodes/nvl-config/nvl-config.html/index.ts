import { EditorRED, EditorNodeProperties } from 'node-red'
import { NvlConfigOptions } from '../types'

interface NvlConfigEditorNodeProperties
  extends EditorNodeProperties,
  NvlConfigOptions {
  editor?: AceAjax.Editor
}

declare const RED: EditorRED

RED.nodes.registerType<NvlConfigEditorNodeProperties>('nvl-config', {
  category: 'config',
  defaults: {
    name: { value: '' },
    projectId: { 
      value: '861089024',
      required: true,
      validate: RED.validators.number(),
    },
    netvarListId: { 
      value: '',
      required: true,
      validate: RED.validators.number(), 
    },
    netvarList: { 
      value: '',
      required: true, 
    },
  },
  label() {
    return this.name || 'nvl config'
  },
  oneditprepare() {
    this.editor = RED.editor.createEditor({
      id: 'node-config-input-netvarList-editor',
      mode: 'ace/mode/text',
      value: this.netvarList,
    })
  },
  oneditsave() {
    if (this.editor) {
      this.netvarList = this.editor.getValue()
      this.editor.destroy()
    }
  },
  oneditcancel() {
    this.editor?.destroy()
  },

})
