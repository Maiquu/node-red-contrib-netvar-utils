export const PACKET_HEADER_SIZE = 20
/** Packet sizes can exceed `MAX_PACKET_SIZE` if said packet only contains a string that exceeds `MAX_VARIABLE_SIZE` */
export const MAX_PACKET_SIZE = 276
/** **NOTE:** Strings are exception to this rule */
export const MAX_VARIABLE_SIZE = 256

// Packet header offsets
/** uint_32 LE */
export const OFFSET_ID = 0
/** uint_16 LE */
export const OFFSET_LIST_ID = 8
/** uint_16 LE */
export const OFFSET_PACKET_INDEX = 10
/** uint_16 LE */
export const OFFSET_VAR_COUNT = 12
/** uint_16 LE */
export const OFFSET_PACKET_SIZE = 14
/** uint_32 LE */
export const OFFSET_COUNTER = 16