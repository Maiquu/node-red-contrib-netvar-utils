import { EditorNodeProperties } from 'node-red'
import { NvlJsonOptions } from '../../shared/types'

export interface NvlJsonEditorNodeProperties
  extends EditorNodeProperties,
  NvlJsonOptions {}
