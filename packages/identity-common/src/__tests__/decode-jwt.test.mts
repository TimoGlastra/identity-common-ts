import { describe, expect, it } from 'vitest'
import { base64urlEncode } from '../base64url'
import { decodeJwt } from '../decode-jwt'

describe('decodeJwt', () => {
  it('should decode a JWT into header, payload, and signature', () => {
    const header = { alg: 'ES256', typ: 'JWT' }
    const payload = { sub: '1234567890', name: 'John Doe', iat: 1516239022 }
    const jwt = `${base64urlEncode(JSON.stringify(header))}.${base64urlEncode(JSON.stringify(payload))}.signature`

    const result = decodeJwt(jwt)
    expect(result.header).toEqual(header)
    expect(result.payload).toEqual(payload)
    expect(result.signature).toBe('signature')
  })

  it('should throw an error for invalid JWT format', () => {
    expect(() => decodeJwt('not.a.valid.jwt')).toThrow('Invalid JWT as input')
    expect(() => decodeJwt('onlyonepart')).toThrow('Invalid JWT as input')
  })

  it('should decode with custom generic types', () => {
    const header = { alg: 'RS256', kid: 'key-1' }
    const payload = { iss: 'https://example.com', exp: 9999999999 }
    const jwt = `${base64urlEncode(JSON.stringify(header))}.${base64urlEncode(JSON.stringify(payload))}.sig`

    const result = decodeJwt<{ alg: string; kid: string }, { iss: string; exp: number }>(jwt)
    expect(result.header.kid).toBe('key-1')
    expect(result.payload.iss).toBe('https://example.com')
  })
})
