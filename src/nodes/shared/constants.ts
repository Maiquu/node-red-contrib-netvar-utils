export const PACKET_HEADER_SIZE = 20
/** Packet sizes can exceed `MAX_PACKET_SIZE` if said packet only contains a string that exceeds `MAX_VARIABLE_SIZE` */
export const MAX_PACKET_SIZE = 276
/** **NOTE:** Strings are exception to this rule */
export const MAX_VARIABLE_SIZE = 256