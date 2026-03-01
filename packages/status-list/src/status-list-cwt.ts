import * as cbor from 'cbor-x'
import type { CWTwithStatusListPayload, StatusListCBOR, StatusListCWTHeader, StatusListCWTPayload } from './cwt-types'
import { CWT_STATUS_LIST_TYPE, CWTStatusListInfoKeys, CWTStatusListKeys } from './cwt-types'
import { StatusList } from './status-list'
import { SLException } from './status-list-exception'
import type { BitsPerStatus, StatusListEntry } from './types'

function encodeCBORMap(obj: Record<string | number, unknown>): Uint8Array {
  return cbor.encode(obj)
}

function decodeCBOR<T>(data: Uint8Array): T {
  return cbor.decode(data) as T
}

/**
 * Creates the CWT claims payload for a Status List Token.
 */
export function createStatusListCWTPayload(
  list: StatusList,
  subject: string,
  issuedAt: number,
  options?: {
    exp?: number
    ttl?: number
    aggregationUri?: string
  }
): StatusListCWTPayload {
  if (!subject) {
    throw new SLException('subject is required')
  }
  if (!issuedAt) {
    throw new SLException('issuedAt is required')
  }

  const statusListCBOR: StatusListCBOR = {
    bits: list.getBitsPerStatus(),
    lst: list.compressStatusListToBytes(),
  }

  if (options?.aggregationUri) {
    statusListCBOR.aggregation_uri = options.aggregationUri
  }

  const payload: StatusListCWTPayload = {
    2: subject,
    6: issuedAt,
    65533: statusListCBOR,
  }

  if (options?.exp !== undefined) {
    payload[4] = options.exp
  }

  if (options?.ttl !== undefined) {
    payload[65534] = options.ttl
  }

  return payload
}

/**
 * Key resolution options for CWT header
 */
export interface CWTHeaderKeyOptions {
  kid?: string | Uint8Array
  x5chain?: Uint8Array | Uint8Array[]
  x5t?: Uint8Array
  x5u?: string
}

/**
 * Creates the protected header for a Status List CWT.
 */
export function createStatusListCWTHeader(
  alg: number,
  kidOrOptions?: string | Uint8Array | CWTHeaderKeyOptions
): StatusListCWTHeader {
  const header: StatusListCWTHeader = {
    1: alg,
    16: CWT_STATUS_LIST_TYPE,
  }

  if (kidOrOptions !== undefined) {
    if (typeof kidOrOptions === 'string' || kidOrOptions instanceof Uint8Array) {
      header[4] = kidOrOptions
    } else {
      if (kidOrOptions.kid !== undefined) {
        header[4] = kidOrOptions.kid
      }
      if (kidOrOptions.x5chain !== undefined) {
        header[33] = kidOrOptions.x5chain
      }
      if (kidOrOptions.x5t !== undefined) {
        header[34] = kidOrOptions.x5t
      }
      if (kidOrOptions.x5u !== undefined) {
        header[35] = kidOrOptions.x5u
      }
    }
  }

  return header
}

/**
 * Encodes a Status List into CBOR format for CWT.
 */
export function encodeStatusListToCBOR(list: StatusList, aggregationUri?: string): Uint8Array {
  const statusListMap: Record<string, unknown> = {
    [CWTStatusListKeys.BITS]: list.getBitsPerStatus(),
    [CWTStatusListKeys.LST]: list.compressStatusListToBytes(),
  }

  if (aggregationUri) {
    statusListMap[CWTStatusListKeys.AGGREGATION_URI] = aggregationUri
  }

  return encodeCBORMap(statusListMap)
}

/**
 * Decodes a CBOR-encoded status list.
 */
export function decodeStatusListFromCBOR(cborData: Uint8Array): StatusList {
  const decoded = decodeCBOR<StatusListCBOR>(cborData)
  return StatusList.decompressStatusListFromBytes(decoded.lst, decoded.bits)
}

/**
 * Encodes the full CWT claims payload to CBOR.
 */
export function encodeCWTPayload(
  list: StatusList,
  subject: string,
  issuedAt: number,
  options?: {
    exp?: number
    ttl?: number
    aggregationUri?: string
  }
): Uint8Array {
  const payload = createStatusListCWTPayload(list, subject, issuedAt, options)

  const cborPayload = new Map<number, unknown>()
  cborPayload.set(2, payload[2])
  cborPayload.set(6, payload[6])

  if (payload[4] !== undefined) {
    cborPayload.set(4, payload[4])
  }
  if (payload[65534] !== undefined) {
    cborPayload.set(65534, payload[65534])
  }

  const statusListMap = new Map<string, unknown>()
  statusListMap.set('bits', payload[65533].bits)
  statusListMap.set('lst', payload[65533].lst)
  if (payload[65533].aggregation_uri) {
    statusListMap.set('aggregation_uri', payload[65533].aggregation_uri)
  }
  cborPayload.set(65533, statusListMap)

  return cbor.encode(cborPayload)
}

/**
 * Decodes a CBOR-encoded CWT payload.
 */
export function decodeCWTPayload(cborData: Uint8Array): {
  subject: string
  issuedAt: number
  exp?: number
  ttl?: number
  statusList: StatusList
  aggregationUri?: string
} {
  const decoded = decodeCBOR<Map<number, unknown>>(cborData)

  const getValue = (key: number): unknown => {
    if (decoded instanceof Map) {
      return decoded.get(key)
    }
    return (decoded as Record<number, unknown>)[key]
  }

  const subject = getValue(2) as string
  const issuedAt = getValue(6) as number
  const exp = getValue(4) as number | undefined
  const ttl = getValue(65534) as number | undefined
  const statusListData = getValue(65533) as Map<string, unknown> | Record<string, unknown>

  let bits: BitsPerStatus
  let lst: Uint8Array
  let aggregationUri: string | undefined

  if (statusListData instanceof Map) {
    bits = statusListData.get('bits') as BitsPerStatus
    lst = statusListData.get('lst') as Uint8Array
    aggregationUri = statusListData.get('aggregation_uri') as string | undefined
  } else {
    bits = statusListData.bits as BitsPerStatus
    lst = statusListData.lst as Uint8Array
    aggregationUri = statusListData.aggregation_uri as string | undefined
  }

  const statusList = StatusList.decompressStatusListFromBytes(lst, bits)

  return {
    subject,
    issuedAt,
    exp,
    ttl,
    statusList,
    aggregationUri,
  }
}

/**
 * Creates a status claim for a Referenced Token in CWT format.
 */
export function createCWTStatusClaim(idx: number, uri: string): CWTwithStatusListPayload[65535] {
  return {
    status_list: {
      idx,
      uri,
    },
  }
}

/**
 * Encodes a status claim for a Referenced Token to CBOR.
 */
export function encodeCWTStatusClaim(idx: number, uri: string): Uint8Array {
  const statusClaim = new Map<string, unknown>()
  const statusListInfo = new Map<string, unknown>()
  statusListInfo.set(CWTStatusListInfoKeys.IDX, idx)
  statusListInfo.set(CWTStatusListInfoKeys.URI, uri)
  statusClaim.set('status_list', statusListInfo)

  return cbor.encode(statusClaim)
}

/**
 * Decodes a status claim from a Referenced Token CWT.
 */
export function decodeCWTStatusClaim(cborData: Uint8Array): StatusListEntry {
  const decoded = decodeCBOR<Map<string, unknown> | Record<string, unknown>>(cborData)

  let statusList: Map<string, unknown> | Record<string, unknown>

  if (decoded instanceof Map) {
    statusList = decoded.get('status_list') as Map<string, unknown> | Record<string, unknown>
  } else {
    statusList = decoded.status_list as Map<string, unknown> | Record<string, unknown>
  }

  if (statusList instanceof Map) {
    return {
      idx: statusList.get(CWTStatusListInfoKeys.IDX) as number,
      uri: statusList.get(CWTStatusListInfoKeys.URI) as string,
    }
  }
  return {
    idx: statusList[CWTStatusListInfoKeys.IDX] as number,
    uri: statusList[CWTStatusListInfoKeys.URI] as string,
  }
}

/**
 * Extracts the status list from a decoded CWT payload.
 */
export function getListFromStatusListCWT(cwtPayload: Uint8Array): StatusList {
  const { statusList } = decodeCWTPayload(cwtPayload)
  return statusList
}

/**
 * Extracts the status list entry from a decoded Referenced Token CWT.
 */
export function getStatusListFromCWT(cwtPayload: Uint8Array): StatusListEntry {
  const decoded = decodeCBOR<Map<number, unknown> | Record<number, unknown>>(cwtPayload)

  let statusClaim: Map<string, unknown> | Record<string, unknown>

  if (decoded instanceof Map) {
    statusClaim = decoded.get(65535) as Map<string, unknown> | Record<string, unknown>
  } else {
    statusClaim = decoded[65535] as Map<string, unknown> | Record<string, unknown>
  }

  if (!statusClaim) {
    throw new SLException('No status claim found in CWT payload')
  }

  let statusList: Map<string, unknown> | Record<string, unknown>

  if (statusClaim instanceof Map) {
    statusList = statusClaim.get('status_list') as Map<string, unknown> | Record<string, unknown>
  } else {
    statusList = statusClaim.status_list as Map<string, unknown> | Record<string, unknown>
  }

  if (!statusList) {
    throw new SLException('No status_list found in status claim')
  }

  if (statusList instanceof Map) {
    return {
      idx: statusList.get('idx') as number,
      uri: statusList.get('uri') as string,
    }
  }

  return {
    idx: statusList.idx as number,
    uri: statusList.uri as string,
  }
}

/**
 * COSE Algorithm identifiers
 * @see https://www.iana.org/assignments/cose/cose.xhtml#algorithms
 */
export const COSEAlgorithms = {
  ES256: -7,
  ES384: -35,
  ES512: -36,
  EdDSA: -8,
  PS256: -37,
  PS384: -38,
  PS512: -39,
  RS256: -257,
  RS384: -258,
  RS512: -259,
} as const

export type COSEAlgorithm = (typeof COSEAlgorithms)[keyof typeof COSEAlgorithms]
