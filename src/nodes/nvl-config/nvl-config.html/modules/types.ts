import { EditorNodeProperties } from 'node-red'
import { NvlConfigOptions } from '../../shared/types'

export interface NvlConfigEditorNodeProperties
  extends EditorNodeProperties,
  NvlConfigOptions {
  editor?: AceAjax.Editor
}
