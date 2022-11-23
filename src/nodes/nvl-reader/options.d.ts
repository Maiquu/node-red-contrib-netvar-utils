import { EditorWidgetTypedInputType } from 'node-red'

export interface NvlReaderOptions {
  nvl: string
  emitOn: 'last-packet' | 'every-packet'
  initial: string
  initialType: EditorWidgetTypedInputType
}
