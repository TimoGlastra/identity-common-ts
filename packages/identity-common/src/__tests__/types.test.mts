import { describe, expect, expectTypeOf, it } from 'vitest'
import type {
  Base64urlString,
  HashAlgorithm,
  Hasher,
  HasherAndAlg,
  HasherAndAlgSync,
  HasherSync,
  JsonWebKey,
  JwtPayload,
  OrPromise,
  RsaOtherPrimesInfo,
  SaltGenerator,
  SaltGeneratorSync,
  Signer,
  SignerSync,
  Verifier,
  VerifierSync,
} from '../types'
import { IANA_HASH_ALGORITHMS } from '../types'

describe('types', () => {
  it('should have IANA_HASH_ALGORITHMS as a readonly tuple', () => {
    expect(IANA_HASH_ALGORITHMS).toContain('sha-256')
    expect(IANA_HASH_ALGORITHMS).toContain('sha-384')
    expect(IANA_HASH_ALGORITHMS).toContain('sha-512')
    expect(IANA_HASH_ALGORITHMS.length).toBe(17)
  })

  it('should correctly type JwtPayload', () => {
    const payload: JwtPayload = {
      exp: 123456,
      custom: 'value',
    }
    expectTypeOf(payload.exp).toEqualTypeOf<number | undefined>()
  })

  it('should correctly type JsonWebKey', () => {
    const jwk: JsonWebKey = {
      kty: 'EC',
      crv: 'P-256',
      x: 'abc',
      y: 'def',
    }
    expectTypeOf(jwk.kty).toEqualTypeOf<string | undefined>()
  })

  it('should type OrPromise correctly', () => {
    expectTypeOf<OrPromise<string>>().toEqualTypeOf<string | Promise<string>>()
  })

  it('should type Signer and SignerSync', () => {
    expectTypeOf<Signer>().toBeFunction()
    expectTypeOf<SignerSync>().toBeFunction()
  })

  it('should type Verifier and VerifierSync', () => {
    expectTypeOf<Verifier>().toBeFunction()
    expectTypeOf<VerifierSync>().toBeFunction()
  })

  it('should type Hasher and HasherSync', () => {
    expectTypeOf<Hasher>().toBeFunction()
    expectTypeOf<HasherSync>().toBeFunction()
  })

  it('should type SaltGenerator and SaltGeneratorSync', () => {
    expectTypeOf<SaltGenerator>().toBeFunction()
    expectTypeOf<SaltGeneratorSync>().toBeFunction()
  })

  it('should type HasherAndAlg and HasherAndAlgSync', () => {
    expectTypeOf<HasherAndAlg>().toHaveProperty('hasher')
    expectTypeOf<HasherAndAlg>().toHaveProperty('alg')
    expectTypeOf<HasherAndAlgSync>().toHaveProperty('hasher')
    expectTypeOf<HasherAndAlgSync>().toHaveProperty('alg')
  })

  it('should type HashAlgorithm as a union of IANA algorithms', () => {
    const alg: HashAlgorithm = 'sha-256'
    expectTypeOf(alg).toMatchTypeOf<HashAlgorithm>()
  })

  it('should type Base64urlString as string', () => {
    expectTypeOf<Base64urlString>().toEqualTypeOf<string>()
  })

  it('should type RsaOtherPrimesInfo', () => {
    expectTypeOf<RsaOtherPrimesInfo>().toHaveProperty('d')
    expectTypeOf<RsaOtherPrimesInfo>().toHaveProperty('r')
    expectTypeOf<RsaOtherPrimesInfo>().toHaveProperty('t')
  })
})
