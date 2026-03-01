import type { BitsPerStatus, StatusListEntry } from '@owf/status-list'

// ==================== CWT Types ====================

/**
 * CWT Claim Keys as defined in draft-ietf-oauth-status-list
 * @see https://www.ietf.org/archive/id/draft-ietf-oauth-status-list-16.html#section-5.2
 */
export const CWTClaimKeys = {
  SUB: 2,
  EXP: 4,
  IAT: 6,
  TTL: 65534,
  STATUS_LIST: 65533,
  STATUS: 65535,
} as const

/**
 * CWT Status List map keys
 */
export const CWTStatusListKeys = {
  BITS: 'bits',
  LST: 'lst',
  AGGREGATION_URI: 'aggregation_uri',
} as const

/**
 * CWT Status List Info keys (for referenced tokens)
 */
export const CWTStatusListInfoKeys = {
  IDX: 'idx',
  URI: 'uri',
} as const

/**
 * COSE Header type parameter value for Status List CWT
 * @see https://www.ietf.org/archive/id/draft-ietf-oauth-status-list-16.html#section-5.2
 */
export const CWT_STATUS_LIST_TYPE = 'application/statuslist+cwt'

/**
 * CoAP Content-Format ID for Status List CWT (TBD in IANA registry)
 */
export const CWT_STATUS_LIST_CONTENT_FORMAT_ID: number | undefined = undefined

/**
 * COSE Header parameter keys
 * @see https://www.iana.org/assignments/cose/cose.xhtml#header-parameters
 */
export const COSEHeaderKeys = {
  ALG: 1,
  CRIT: 2,
  CONTENT_TYPE: 3,
  KID: 4,
  IV: 5,
  PARTIAL_IV: 6,
  TYPE: 16,
  X5CHAIN: 33,
  X5T: 34,
  X5U: 35,
} as const

/**
 * Status List in CBOR format
 */
export interface StatusListCBOR {
  bits: BitsPerStatus
  lst: Uint8Array
  aggregation_uri?: string
}

/**
 * CWT Claims Set for a Status List Token
 */
export interface StatusListCWTPayload {
  [CWTClaimKeys.SUB]: string
  [CWTClaimKeys.IAT]: number
  [CWTClaimKeys.EXP]?: number
  [CWTClaimKeys.TTL]?: number
  [CWTClaimKeys.STATUS_LIST]: StatusListCBOR
}

/**
 * CWT Claims Set for a Referenced Token with status
 */
export interface CWTwithStatusListPayload {
  [CWTClaimKeys.SUB]?: string
  [CWTClaimKeys.IAT]?: number
  [CWTClaimKeys.EXP]?: number
  [CWTClaimKeys.STATUS]: {
    status_list: StatusListEntry
  }
}

/**
 * COSE protected header for Status List CWT
 */
export interface StatusListCWTHeader {
  [COSEHeaderKeys.ALG]: number
  [COSEHeaderKeys.TYPE]: string | number
  [COSEHeaderKeys.KID]?: Uint8Array | string
  [COSEHeaderKeys.X5CHAIN]?: Uint8Array | Uint8Array[]
  [COSEHeaderKeys.X5T]?: Uint8Array
  [COSEHeaderKeys.X5U]?: string
}
