import { describe, expect, it } from 'vitest'
import { base64UrlToUint8Array, base64urlDecode, base64urlEncode, uint8ArrayToBase64Url } from '../base64url'

describe('base64url', () => {
  it('should encode and decode strings', () => {
    const input = 'Hello, World!'
    const encoded = base64urlEncode(input)
    const decoded = base64urlDecode(encoded)
    expect(decoded).toBe(input)
  })

  it('should handle URL-safe encoding', () => {
    const input = 'subjects?_d'
    const encoded = base64urlEncode(input)
    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
    expect(encoded).not.toContain('=')
    expect(base64urlDecode(encoded)).toBe(input)
  })

  it('should encode and decode Uint8Array', () => {
    const input = new Uint8Array([72, 101, 108, 108, 111])
    const encoded = uint8ArrayToBase64Url(input)
    const decoded = base64UrlToUint8Array(encoded)
    expect(decoded).toEqual(input)
  })

  it('should produce URL-safe base64 from Uint8Array', () => {
    const input = new Uint8Array([0xff, 0xfe, 0xfd])
    const encoded = uint8ArrayToBase64Url(input)
    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
  })
})
