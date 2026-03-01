import * as cbor from 'cbor-x'
import { describe, expect, it } from 'vitest'
import { CWT_STATUS_LIST_TYPE } from '../cwt-types'
import { StatusList } from '../status-list'
import {
  COSEAlgorithms,
  createCWTStatusClaim,
  createStatusListCWTHeader,
  createStatusListCWTPayload,
  decodeCWTPayload,
  decodeCWTStatusClaim,
  decodeStatusListFromCBOR,
  encodeCWTPayload,
  encodeCWTStatusClaim,
  encodeStatusListToCBOR,
  getListFromStatusListCWT,
  getStatusListFromCWT,
} from '../status-list-cwt'

describe('StatusListCWT', () => {
  const listLength = 100

  describe('createStatusListCWTPayload', () => {
    it('should create a valid CWT payload', () => {
      const statusList = new StatusList(new Array(listLength).fill(0), 1)
      statusList.setStatus(0, 1)
      statusList.setStatus(5, 1)

      const payload = createStatusListCWTPayload(statusList, 'https://example.com/statuslists/1', 1000000)

      expect(payload[2]).toBe('https://example.com/statuslists/1')
      expect(payload[6]).toBe(1000000)
      expect(payload[65533]).toBeDefined()
      expect(payload[65533].bits).toBe(1)
      expect(payload[65533].lst).toBeInstanceOf(Uint8Array)
    })

    it('should include optional exp and ttl', () => {
      const statusList = new StatusList(new Array(listLength).fill(0), 1)
      const payload = createStatusListCWTPayload(statusList, 'https://example.com/statuslists/1', 1000000, {
        exp: 2000000,
        ttl: 3600,
      })

      expect(payload[4]).toBe(2000000)
      expect(payload[65534]).toBe(3600)
    })

    it('should throw if subject is empty', () => {
      const statusList = new StatusList(new Array(listLength).fill(0), 1)
      expect(() => createStatusListCWTPayload(statusList, '', 1000000)).toThrow('subject is required')
    })

    it('should throw if issuedAt is 0', () => {
      const statusList = new StatusList(new Array(listLength).fill(0), 1)
      expect(() => createStatusListCWTPayload(statusList, 'https://example.com/statuslists/1', 0)).toThrow(
        'issuedAt is required'
      )
    })

    it('should include aggregation URI', () => {
      const statusList = new StatusList(new Array(listLength).fill(0), 1)
      const payload = createStatusListCWTPayload(statusList, 'https://example.com/statuslists/1', 1000000, {
        aggregationUri: 'https://example.com/aggregate',
      })
      expect(payload[65533].aggregation_uri).toBe('https://example.com/aggregate')
    })
  })

  describe('createStatusListCWTHeader', () => {
    it('should create a valid header', () => {
      const header = createStatusListCWTHeader(COSEAlgorithms.ES256)

      expect(header[1]).toBe(COSEAlgorithms.ES256)
      expect(header[16]).toBe(CWT_STATUS_LIST_TYPE)
    })

    it('should include kid as string', () => {
      const header = createStatusListCWTHeader(COSEAlgorithms.ES256, 'my-key-id')
      expect(header[4]).toBe('my-key-id')
    })

    it('should include kid as Uint8Array', () => {
      const kid = new Uint8Array([1, 2, 3])
      const header = createStatusListCWTHeader(COSEAlgorithms.ES256, kid)
      expect(header[4]).toEqual(kid)
    })

    it('should accept key options object', () => {
      const header = createStatusListCWTHeader(COSEAlgorithms.ES256, {
        kid: 'key-1',
        x5u: 'https://example.com/cert',
      })
      expect(header[4]).toBe('key-1')
      expect(header[35]).toBe('https://example.com/cert')
    })
  })

  describe('CBOR encode/decode', () => {
    it('should encode and decode a status list via CBOR', () => {
      const statusList = new StatusList(new Array(listLength).fill(0), 1)
      statusList.setStatus(0, 1)
      statusList.setStatus(5, 1)

      const encoded = encodeStatusListToCBOR(statusList)
      const decoded = decodeStatusListFromCBOR(encoded)

      expect(decoded.getStatus(0)).toBe(1)
      expect(decoded.getStatus(1)).toBe(0)
      expect(decoded.getStatus(5)).toBe(1)
    })

    it('should encode and decode full CWT payload', () => {
      const statusList = new StatusList(new Array(listLength).fill(0), 1)
      statusList.setStatus(0, 1)
      statusList.setStatus(5, 1)

      const encoded = encodeCWTPayload(statusList, 'https://example.com/statuslists/1', 1000000, {
        exp: 2000000,
        ttl: 3600,
      })
      const decoded = decodeCWTPayload(encoded)

      expect(decoded.subject).toBe('https://example.com/statuslists/1')
      expect(decoded.issuedAt).toBe(1000000)
      expect(decoded.exp).toBe(2000000)
      expect(decoded.ttl).toBe(3600)
      expect(decoded.statusList.getStatus(0)).toBe(1)
      expect(decoded.statusList.getStatus(1)).toBe(0)
      expect(decoded.statusList.getStatus(5)).toBe(1)
    })

    it('should roundtrip with getListFromStatusListCWT', () => {
      const statusList = new StatusList(new Array(listLength).fill(0), 2)
      statusList.setStatus(0, 3)
      statusList.setStatus(10, 2)

      const encoded = encodeCWTPayload(statusList, 'https://example.com/statuslists/1', 1000000)
      const decoded = getListFromStatusListCWT(encoded)

      expect(decoded.getStatus(0)).toBe(3)
      expect(decoded.getStatus(10)).toBe(2)
      expect(decoded.getStatus(1)).toBe(0)
    })
  })

  describe('CWT status claim', () => {
    it('should create a status claim object', () => {
      const claim = createCWTStatusClaim(42, 'https://example.com/statuslists/1')
      expect(claim.status_list.idx).toBe(42)
      expect(claim.status_list.uri).toBe('https://example.com/statuslists/1')
    })

    it('should encode and decode status claim via CBOR', () => {
      const encoded = encodeCWTStatusClaim(42, 'https://example.com/statuslists/1')
      const decoded = decodeCWTStatusClaim(encoded)

      expect(decoded.idx).toBe(42)
      expect(decoded.uri).toBe('https://example.com/statuslists/1')
    })

    it('should extract status entry from CWT payload', () => {
      const cwtPayload = new Map<number, unknown>()
      cwtPayload.set(2, 'user123')
      cwtPayload.set(6, 1000000)
      const statusClaim = new Map<string, unknown>()
      const statusListInfo = new Map<string, unknown>()
      statusListInfo.set('idx', 42)
      statusListInfo.set('uri', 'https://example.com/statuslists/1')
      statusClaim.set('status_list', statusListInfo)
      cwtPayload.set(65535, statusClaim)

      const encoded = cbor.encode(cwtPayload)
      const entry = getStatusListFromCWT(encoded)

      expect(entry.idx).toBe(42)
      expect(entry.uri).toBe('https://example.com/statuslists/1')
    })
  })

  describe('COSE algorithms', () => {
    it('should have correct algorithm identifiers', () => {
      expect(COSEAlgorithms.ES256).toBe(-7)
      expect(COSEAlgorithms.ES384).toBe(-35)
      expect(COSEAlgorithms.ES512).toBe(-36)
      expect(COSEAlgorithms.EdDSA).toBe(-8)
    })
  })
})
