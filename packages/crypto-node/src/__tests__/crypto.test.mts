import { describe, expect, it } from 'vitest'
import { digest, ES256, ES384, generateSalt, getHasher } from '../crypto'

describe('crypto-node', () => {
  describe('generateSalt', () => {
    it('should generate a salt of the specified length', () => {
      const salt = generateSalt(16)
      expect(salt.length).toBe(16)
    })

    it('should return empty string for zero length', () => {
      expect(generateSalt(0)).toBe('')
    })

    it('should return empty string for negative length', () => {
      expect(generateSalt(-1)).toBe('')
    })
  })

  describe('digest', () => {
    it('should hash a string with sha-256 by default', () => {
      const result = digest('hello')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('should hash an ArrayBuffer', () => {
      const encoder = new TextEncoder()
      const result = digest(encoder.encode('hello').buffer as ArrayBuffer)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('should produce consistent results', () => {
      const a = digest('hello')
      const b = digest('hello')
      expect(a).toEqual(b)
    })
  })

  describe('getHasher', () => {
    it('should return a function that hashes with default sha-256', () => {
      const hash = getHasher()
      const result = hash('hello')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })
  })

  describe('ES256', () => {
    it('should generate key pair, sign and verify', async () => {
      const { publicKey, privateKey } = await ES256.generateKeyPair()
      const signer = await ES256.getSigner(privateKey)
      const verifier = await ES256.getVerifier(publicKey)

      const data = 'hello world'
      const signature = await signer(data)
      const isValid = await verifier(data, signature)
      expect(isValid).toBe(true)
    })

    it('should fail verification with wrong data', async () => {
      const { publicKey, privateKey } = await ES256.generateKeyPair()
      const signer = await ES256.getSigner(privateKey)
      const verifier = await ES256.getVerifier(publicKey)

      const signature = await signer('hello')
      const isValid = await verifier('world', signature)
      expect(isValid).toBe(false)
    })
  })

  describe('ES384', () => {
    it('should generate key pair, sign and verify', async () => {
      const { publicKey, privateKey } = await ES384.generateKeyPair()
      const signer = await ES384.getSigner(privateKey)
      const verifier = await ES384.getVerifier(publicKey)

      const data = 'hello world'
      const signature = await signer(data)
      const isValid = await verifier(data, signature)
      expect(isValid).toBe(true)
    })
  })
})
