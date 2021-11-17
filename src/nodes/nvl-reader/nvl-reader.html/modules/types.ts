import { EditorNodeProperties } from 'node-red'
import { NvlReaderOptions } from '../../shared/types'

export interface NvlReaderEditorNodeProperties
  extends EditorNodeProperties,
  NvlReaderOptions {}
