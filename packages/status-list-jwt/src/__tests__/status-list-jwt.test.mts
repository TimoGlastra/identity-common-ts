import type { JwtPayload } from '@owf/identity-common'
import { base64urlEncode } from '@owf/identity-common'
import { StatusList } from '@owf/status-list'
import { describe, expect, it } from 'vitest'
import { createHeaderAndPayload, getListFromStatusListJWT, getStatusListFromJWT } from '../status-list-jwt'
import type { JWTwithStatusListPayload, StatusListJWTHeaderParameters } from '../types'

describe('StatusListJWT', () => {
  const header: StatusListJWTHeaderParameters = {
    alg: 'ES256',
    typ: 'statuslist+jwt',
  }

  /**
   * Helper that creates a fake JWT (not cryptographically signed) from header + payload.
   */
  function fakeJwt(h: object, p: object): string {
    return `${base64urlEncode(JSON.stringify(h))}.${base64urlEncode(JSON.stringify(p))}.fakesig`
  }

  it('should create header and payload with status list', () => {
    const statusList = new StatusList([1, 0, 1, 1, 1], 1)
    const payload: JwtPayload = {
      sub: 'https://example.com/statuslist/1',
      iat: Math.floor(Date.now() / 1000),
    }

    const values = createHeaderAndPayload(statusList, payload, header)
    expect(values.header.typ).toBe('statuslist+jwt')
    expect(values.payload.status_list).toBeDefined()
    expect((values.payload.status_list as { bits: number }).bits).toBe(1)
    expect(typeof (values.payload.status_list as { lst: string }).lst).toBe('string')
  })

  it('should throw if sub is missing', () => {
    const statusList = new StatusList([1, 0, 1], 1)
    const payload: JwtPayload = { iat: 123 }
    expect(() => createHeaderAndPayload(statusList, payload, header)).toThrow('sub field is required')
  })

  it('should throw if iat is missing', () => {
    const statusList = new StatusList([1, 0, 1], 1)
    const payload: JwtPayload = { sub: 'https://example.com/statuslist/1' }
    expect(() => createHeaderAndPayload(statusList, payload, header)).toThrow('iat field is required')
  })

  it('should get status list from a JWT without verifying signature', () => {
    const list = [1, 0, 1, 0, 1]
    const statusList = new StatusList(list, 1)
    const payload: JwtPayload = {
      sub: 'https://example.com/statuslist/1',
      iat: Math.floor(Date.now() / 1000),
    }

    const values = createHeaderAndPayload(statusList, payload, { ...header })
    const jwt = fakeJwt(values.header, values.payload)

    const extractedList = getListFromStatusListJWT(jwt)
    for (let i = 0; i < list.length; i++) {
      expect(extractedList.getStatus(i)).toBe(list[i])
    }
  })

  it('should get the status entry from a JWT', () => {
    const payload: JWTwithStatusListPayload = {
      sub: 'https://example.com/status/1',
      iat: Math.floor(Date.now() / 1000),
      status: {
        status_list: {
          idx: 0,
          uri: 'https://example.com/status/1',
        },
      },
    }
    const jwt = fakeJwt({ alg: 'ES256' }, payload)
    const reference = getStatusListFromJWT(jwt)
    expect(reference).toEqual(payload.status.status_list)
  })
})
