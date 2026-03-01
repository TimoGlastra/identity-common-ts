// ==================== Common Types & Constants ====================

/**
 * Status Type values as defined in the spec.
 * @see https://www.ietf.org/archive/id/draft-ietf-oauth-status-list-16.html#section-7
 */
export const StatusTypes = {
  /** The status of the Referenced Token is valid, correct or legal. */
  VALID: 0x00,
  /** The status of the Referenced Token is revoked, annulled, taken back, recalled or cancelled. */
  INVALID: 0x01,
  /** The status of the Referenced Token is temporarily invalid, hanging, debarred from privilege. */
  SUSPENDED: 0x02,
  /** Application-specific status (0x03). */
  APPLICATION_SPECIFIC_3: 0x03,
  /** Application-specific status range start (0x0C). */
  APPLICATION_SPECIFIC_RANGE_START: 0x0c,
  /** Application-specific status range end (0x0F). */
  APPLICATION_SPECIFIC_RANGE_END: 0x0f,
} as const

export type StatusType = (typeof StatusTypes)[keyof typeof StatusTypes] | number

/**
 * Media types for Status List Tokens
 * @see https://www.ietf.org/archive/id/draft-ietf-oauth-status-list-16.html#section-14.7
 */
export const MediaTypes = {
  /** Media type for JWT-based Status List Token */
  STATUS_LIST_JWT: 'application/statuslist+jwt',
  /** Media type for CWT-based Status List Token */
  STATUS_LIST_CWT: 'application/statuslist+cwt',
} as const

/**
 * BitsPerStatus type.
 */
export type BitsPerStatus = 1 | 2 | 4 | 8

/**
 * Reference to a status list entry.
 */
export interface StatusListEntry {
  idx: number
  uri: string
}
