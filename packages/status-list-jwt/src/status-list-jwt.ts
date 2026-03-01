import type { JwtPayload } from '@owf/identity-common'
import { base64UrlToUint8Array, base64urlDecode, uint8ArrayToBase64Url } from '@owf/identity-common'
import type { StatusListEntry } from '@owf/status-list'
import { SLException, StatusList } from '@owf/status-list'
import type { JWTwithStatusListPayload, StatusListJWTHeaderParameters, StatusListJWTPayload } from './types'
import { JWT_STATUS_LIST_TYPE } from './types'

/**
 * Decode a JWT and return the payload.
 * @param jwt JWT token in compact JWS serialization.
 */
function decodeJwtPayload<T>(jwt: string): T {
  const parts = jwt.split('.')
  return JSON.parse(base64urlDecode(parts[1]))
}

/**
 * Adds the status list to the payload and header of a JWT.
 */
export function createHeaderAndPayload(list: StatusList, payload: JwtPayload, header: StatusListJWTHeaderParameters) {
  if (!payload.sub) {
    throw new SLException('sub field is required')
  }
  if (!payload.iat) {
    throw new SLException('iat field is required')
  }

  header.typ = JWT_STATUS_LIST_TYPE
  payload.status_list = {
    bits: list.getBitsPerStatus(),
    lst: uint8ArrayToBase64Url(list.compressStatusListToBytes()),
  }
  return { header, payload }
}

/**
 * Get the status list from a JWT, but do not verify the signature.
 */
export function getListFromStatusListJWT(jwt: string): StatusList {
  const payload = decodeJwtPayload<StatusListJWTPayload>(jwt)
  const statusList = payload.status_list
  const compressed = base64UrlToUint8Array(statusList.lst)
  return StatusList.decompressStatusListFromBytes(compressed, statusList.bits)
}

/**
 * Get the status list entry from a JWT, but do not verify the signature.
 */
export function getStatusListFromJWT(jwt: string): StatusListEntry {
  const payload = decodeJwtPayload<JWTwithStatusListPayload>(jwt)
  return payload.status.status_list
}
