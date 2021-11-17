import { EditorNodeProperties } from 'node-red'
import { NvlEmitterOptions } from '../../shared/types'

export interface NvlEmitterEditorNodeProperties
  extends EditorNodeProperties,
  NvlEmitterOptions {}
