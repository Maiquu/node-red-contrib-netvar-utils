export interface NvPacketHeader {
  /** Protocol identity code */
  protocol: string
  /** ID of the global variable list that is defined on PLC */
  listId: number
  /** Order number of the packet. Can be larger than 0 if the variable list is divided into multiple packets */
  packetIndex: number
  /** Number of variables that is present in packet body */
  variableCount: number
  /** Byte size of packet */
  packetSize: number
  /** Value thats incremented via sender for every variabe list sent */
  counter: number
}

export type NvPacketReader = (target: Record<string, NvValue>, buffer: Buffer) => void

export type NvPacketEmitter = (target: Record<string, NvValue>, counter: number) => Buffer

export interface NvPacket {
  index: number
  size: number
  variableCount: number
  definitions: NvSegmentDefinition[] 
}

export type NvSegmentDefinition =
  | NvArraySegmentDefinition
  | NvSingularDefinition

export interface NvArraySegmentDefinition extends NvArrayDefinition {
  begin: number
  end: number
}

export type NvValue = boolean | number | bigint | string | NvValue[]

export type NvDefinition = 
  | NvArrayDefinition
  | NvSingularDefinition

export interface NvArrayDefinition {
  name: string
  type: NvType
  size: number
  isArray: true
  dimensions: number[]
}

export interface NvSingularDefinition {
  name: string
  type: NvType
  size: number
  isArray: false
}

/** https://help.codesys.com/api-content/2/codesys/3.5.13.0/en/_cds_struct_reference_datatypes */
export type NvType =
  | NvBooleanType
  | NvIntegerType
  | NvBigIntegerType
  | NvFloatingType
  | NvStringType
  | NvTimeType

/** https://help.codesys.com/api-content/2/codesys/3.5.13.0/en/_cds_datatype_bool */
export type NvBooleanType =
  | 'BOOL'

/** https://help.codesys.com/api-content/2/codesys/3.5.13.0/en/_cds_datatype_integer */
export type NvIntegerType =
  | 'BYTE'
  | 'WORD'
  | 'DWORD'
  | 'SINT'
  | 'USINT'
  | 'INT'
  | 'UINT'
  | 'DINT'
  | 'UDINT'

export type NvBigIntegerType =
  | 'LWORD'
  | 'LINT'
  | 'ULINT'

/** https://help.codesys.com/api-content/2/codesys/3.5.13.0/en/_cds_datatype_real */
export type NvFloatingType =
  | 'REAL'
  | 'LREAL'

/** https://help.codesys.com/api-content/2/codesys/3.5.13.0/en/_cds_datatype_wstring */
export type NvStringType =
| 'STRING'
// | 'WSTRING' Not supported

/** https://help.codesys.com/api-content/2/codesys/3.5.13.0/en/_cds_datatype_time */
export type NvTimeType =
  | 'TIME'
  | 'TIME_OF_DAY'
  | 'DATE'
  | 'DATE_AND_TIME'
