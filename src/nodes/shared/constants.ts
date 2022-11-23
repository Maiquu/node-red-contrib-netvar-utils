export const NETVAR_PROTOCOL_ID = '\0-S3'
export const PACKET_HEADER_SIZE = 20
/** Packet sizes can exceed `MAX_PACKET_SIZE` if said packet only contains a string that exceeds `MAX_VARIABLE_SIZE` */
export const MAX_PACKET_SIZE = 276
/** **NOTE:** Strings are exception to this rule */
export const MAX_VARIABLE_SIZE = 256

// Packet header offsets
/** char[4] */
export const OFFSET_PROTOCOL = 0
/** uint_16 LE (Always zero) */
export const OFFSET_ID = 4
/** uint_16 LE */
export const OFFSET_LIST_ID = 8
/** uint_16 LE */
export const OFFSET_PACKET_INDEX = 10
/** uint_16 LE */
export const OFFSET_VAR_COUNT = 12
/** uint_16 LE */
export const OFFSET_PACKET_SIZE = 14
/** uint_16 LE */
export const OFFSET_COUNTER = 16
/** uint_8 */
export const OFFSET_FLAGS = 18
/** uint_8 */
export const OFFSET_CHECKSUM = 19
