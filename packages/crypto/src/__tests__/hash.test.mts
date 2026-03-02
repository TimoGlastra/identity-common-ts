import { describe, expect, it } from 'vitest'
import { hasher, sha256, sha384, sha512 } from '../hash'

describe('hash', () => {
  describe('sha256', () => {
    it('should hash a string', () => {
      const result = sha256('hello')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('should hash an ArrayBuffer', () => {
      const encoder = new TextEncoder()
      const result = sha256(encoder.encode('hello').buffer as ArrayBuffer)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('should produce consistent results', () => {
      const a = sha256('test')
      const b = sha256('test')
      expect(a).toEqual(b)
    })

    it('should produce different results for different inputs', () => {
      const a = sha256('hello')
      const b = sha256('world')
      expect(a).not.toEqual(b)
    })
  })

  describe('sha384', () => {
    it('should hash a string', () => {
      const result = sha384('hello')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(48)
    })
  })

  describe('sha512', () => {
    it('should hash a string', () => {
      const result = sha512('hello')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)
    })
  })

  describe('hasher', () => {
    it('should default to sha256', () => {
      const a = hasher('hello')
      const b = sha256('hello')
      expect(a).toEqual(b)
    })

    it('should support sha-256 format', () => {
      const a = hasher('hello', 'sha-256')
      const b = sha256('hello')
      expect(a).toEqual(b)
    })

    it('should support sha384', () => {
      const a = hasher('hello', 'sha384')
      const b = sha384('hello')
      expect(a).toEqual(b)
    })

    it('should support sha512', () => {
      const a = hasher('hello', 'sha512')
      const b = sha512('hello')
      expect(a).toEqual(b)
    })

    it('should throw for unsupported algorithm', () => {
      expect(() => hasher('hello', 'md5')).toThrow('Unsupported algorithm: md5')
    })
  })
})
