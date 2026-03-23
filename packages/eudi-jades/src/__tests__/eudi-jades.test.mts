import { ES256 } from '@owf/crypto'
import { describe, expect, it } from 'vitest'
import { ALGORITHMS, CommitmentOIDs, JAdESProfile } from '../constants'
import {
  decode,
  encodeJSON,
  generateX5c,
  generateX5tS256,
  getSigningTime,
  parseCerts,
  type SignAlg,
  verify,
  verifyCompact,
} from '../index'
import { JAdESException } from '../jades-exception'
import {
  GeneralJWSSchema,
  ProtectedHeaderForSigningSchema,
  ProtectedHeaderSchema,
  SignAlgSchema,
  X5tOSchema,
} from '../schemas'
import { Token } from '../token'

// Test certificate and key pair (self-signed EC P-256)
const TEST_CERT = `-----BEGIN CERTIFICATE-----
MIIBczCCARmgAwIBAgIUZt2jkmAgIIiw/wpvJU/4yL7ek/YwCgYIKoZIzj0EAwIw
DzENMAsGA1UEAwwEdGVzdDAeFw0yNjAzMTYxODEwMTJaFw0zNjAzMTMxODEwMTJa
MA8xDTALBgNVBAMMBHRlc3QwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASa6ViW
voU/uOZiBHqFWLE/s+3Ts2K6XT9x2S+abUz/xu48DnP8eL89DQRS8TIUewZbW+H6
GBuyFJjG/mSuqJf+o1MwUTAdBgNVHQ4EFgQUFDKBWF8aGWeDTQHphAhWXs9/J1Aw
HwYDVR0jBBgwFoAUFDKBWF8aGWeDTQHphAhWXs9/J1AwDwYDVR0TAQH/BAUwAwEB
/zAKBggqhkjOPQQDAgNIADBFAiEAibvAwfagitnTA7zKxcl8kuUaU+oBLClK8YXg
s2WfHbwCIAQKqu6+GHkzWH8H0zMPKedvxJp34whrGoIarukWZjjp
-----END CERTIFICATE-----`

const TEST_PRIVATE_KEY = {
  kty: 'EC',
  x: 'mulYlr6FP7jmYgR6hVixP7Pt07Niul0_cdkvmm1M_8Y',
  y: '7jwOc_x4vz0NBFLxMhR7Bltb4foYG7IUmMb-ZK6ol_4',
  crv: 'P-256',
  d: 'tLyuDKbdvUfndRfaH3AmHNFG6kHih59RsYdKGZDtYlE',
}

const TEST_PUBLIC_KEY = {
  kty: 'EC',
  x: 'mulYlr6FP7jmYgR6hVixP7Pt07Niul0_cdkvmm1M_8Y',
  y: '7jwOc_x4vz0NBFLxMhR7Bltb4foYG7IUmMb-ZK6ol_4',
  crv: 'P-256',
}

describe('JAdES Constants', () => {
  it('should export algorithm definitions', () => {
    expect(ALGORITHMS.ES256).toBeDefined()
    expect(ALGORITHMS.ES256.hash).toBe('SHA-256')
    expect(ALGORITHMS.ES256.family).toBe('ECDSA')
    expect(ALGORITHMS.ES256.namedCurve).toBe('P-256')
  })

  it('should export commitment OIDs', () => {
    expect(CommitmentOIDs.proofOfOrigin).toBe('1.2.840.113549.1.9.16.6.1')
    expect(CommitmentOIDs.proofOfCreation).toBe('1.2.840.113549.1.9.16.6.6')
  })

  it('should export JAdES profiles', () => {
    expect(JAdESProfile.B_B).toBe('B-B')
    expect(JAdESProfile.B_T).toBe('B-T')
    expect(JAdESProfile.B_LT).toBe('B-LT')
    expect(JAdESProfile.B_LTA).toBe('B-LTA')
  })
})

describe('JAdES Zod Schemas', () => {
  it('should validate SignAlg', () => {
    expect(SignAlgSchema.safeParse('ES256').success).toBe(true)
    expect(SignAlgSchema.safeParse('ES384').success).toBe(true)
    expect(SignAlgSchema.safeParse('RS256').success).toBe(true)
    expect(SignAlgSchema.safeParse('invalid').success).toBe(false)
    expect(SignAlgSchema.safeParse('none').success).toBe(false)
  })

  it('should validate X5tO', () => {
    expect(
      X5tOSchema.safeParse({
        digAlg: 'S256',
        digVal: 'abc123',
      }).success
    ).toBe(true)

    expect(
      X5tOSchema.safeParse({
        digAlg: '',
        digVal: 'abc123',
      }).success
    ).toBe(false)
  })

  it('should validate ProtectedHeader', () => {
    const validHeader = {
      alg: 'ES256',
      x5c: ['base64cert'],
      kid: 'key-id',
    }
    expect(ProtectedHeaderSchema.safeParse(validHeader).success).toBe(true)

    // Empty header is valid (alg optional for partial headers)
    expect(ProtectedHeaderSchema.safeParse({}).success).toBe(true)

    // Invalid x5u (not URL)
    const invalidUrl = {
      alg: 'ES256',
      x5u: 'not-a-url',
    }
    expect(ProtectedHeaderSchema.safeParse(invalidUrl).success).toBe(false)
  })

  it('should validate ProtectedHeaderForSigning requires certificate header', () => {
    // Valid: has alg and x5c
    const valid = {
      alg: 'ES256',
      x5c: ['cert'],
    }
    expect(ProtectedHeaderForSigningSchema.safeParse(valid).success).toBe(true)

    // Invalid: has alg but no certificate header
    const noCert = {
      alg: 'ES256',
    }
    expect(ProtectedHeaderForSigningSchema.safeParse(noCert).success).toBe(false)

    // Valid with x5t#S256
    const withThumb = {
      alg: 'ES256',
      'x5t#S256': 'thumbprint',
    }
    expect(ProtectedHeaderForSigningSchema.safeParse(withThumb).success).toBe(true)
  })

  it('should validate GeneralJWS structure', () => {
    const valid = {
      payload: 'encodedPayload',
      signatures: [
        {
          protected: 'encodedHeader',
          signature: 'sig123',
        },
      ],
    }
    expect(GeneralJWSSchema.safeParse(valid).success).toBe(true)

    // Invalid: empty signatures
    const noSigs = {
      payload: 'encodedPayload',
      signatures: [],
    }
    expect(GeneralJWSSchema.safeParse(noSigs).success).toBe(false)
  })
})

describe('JAdES Utils', () => {
  it('should parse PEM certificates', () => {
    const certs = parseCerts(TEST_CERT)
    expect(certs).toHaveLength(1)
    expect(certs[0]).toMatch(/^[A-Za-z0-9+/=]+$/)
  })

  it('should generate x5c from PEM', () => {
    const x5c = generateX5c(TEST_CERT)
    expect(x5c).toHaveLength(1)
    expect(x5c[0]).toMatch(/^[A-Za-z0-9+/=]+$/)
  })

  it('should generate x5t#S256 thumbprint', async () => {
    const certs = parseCerts(TEST_CERT)
    const thumbprint = await generateX5tS256(certs[0])
    expect(thumbprint).toBeDefined()
    expect(thumbprint).toMatch(/^[A-Za-z0-9_-]+$/) // base64url
  })

  it('should encode JSON to base64url', () => {
    const obj = { hello: 'world' }
    const encoded = encodeJSON(obj)
    expect(encoded).toBeDefined()
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('should get signing time in ISO format', () => {
    const time = getSigningTime()
    expect(time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
  })
})

describe('JAdES Token', () => {
  it('should create a token with payload', () => {
    const payload = { hello: 'world' }
    const token = new Token(payload)
    expect(token.getPayload()).toEqual(payload)
  })

  it('should set protected header', () => {
    const token = new Token({ data: 'test' })
    const certs = parseCerts(TEST_CERT)

    token.setProtectedHeader({
      alg: 'ES256',
      x5c: certs,
    })

    const header = token.getProtectedHeader()
    expect(header.alg).toBe('ES256')
    expect(header.x5c).toEqual(certs)
  })

  it('should throw if invalid alg is set', () => {
    const token = new Token({ data: 'test' })
    expect(() => token.setProtectedHeader({ alg: 'invalid' as unknown as SignAlg })).toThrow(JAdESException)
  })

  it('should throw when signing without alg', async () => {
    const token = new Token({ data: 'test' })
    const certs = parseCerts(TEST_CERT)
    token.setX5c(certs)

    const signer = await ES256.getSigner(TEST_PRIVATE_KEY)
    await expect(token.sign(signer)).rejects.toThrow(JAdESException)
  })

  it('should set certificate chain via setX5c', () => {
    const token = new Token({ data: 'test' })
    const certs = parseCerts(TEST_CERT)
    token.setX5c(certs)
    expect(token.getProtectedHeader().x5c).toEqual(certs)
  })

  it('should set signing time', () => {
    const token = new Token({ data: 'test' })
    token.setSigningTime()
    const header = token.getProtectedHeader()
    expect(header.sigT).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
  })

  it('should set signedAt timestamp', () => {
    const token = new Token({ data: 'test' })
    const now = Math.floor(Date.now() / 1000)
    token.setSignedAt()
    const header = token.getProtectedHeader()
    expect(header.signedAt).toBeGreaterThanOrEqual(now)
  })

  it('should set kid', () => {
    const token = new Token({ data: 'test' })
    token.setKid('my-key-id')
    expect(token.getProtectedHeader().kid).toBe('my-key-id')
  })

  it('should set content type', () => {
    const token = new Token({ data: 'test' })
    token.setContentType('application/json')
    expect(token.getProtectedHeader().cty).toBe('application/json')
  })

  it('should set token type', () => {
    const token = new Token({ data: 'test' })
    token.setType('jades+json')
    expect(token.getProtectedHeader().typ).toBe('jades+json')
  })

  it('should throw when signing without certificate header', async () => {
    const token = new Token({ data: 'test' })
    token.setProtectedHeader({ alg: 'ES256' })

    const signer = await ES256.getSigner(TEST_PRIVATE_KEY)
    await expect(token.sign(signer)).rejects.toThrow(JAdESException)
  })

  it('should sign and produce compact JWS', async () => {
    const payload = { hello: 'world' }
    const token = new Token(payload)
    const certs = parseCerts(TEST_CERT)

    token.setProtectedHeader({
      alg: 'ES256',
      x5c: certs,
    })

    const signer = await ES256.getSigner(TEST_PRIVATE_KEY)
    await token.sign(signer)

    const jws = token.toString()
    expect(jws.split('.')).toHaveLength(3)
  })

  it('should sign and produce General JWS JSON', async () => {
    const payload = { hello: 'world' }
    const token = new Token(payload)
    const certs = parseCerts(TEST_CERT)

    token.setProtectedHeader({
      alg: 'ES256',
      x5c: certs,
    })

    const signer = await ES256.getSigner(TEST_PRIVATE_KEY)
    await token.sign(signer)

    const generalJws = token.toJSON()
    expect(generalJws.payload).toBeDefined()
    expect(generalJws.signatures).toHaveLength(1)
    expect(generalJws.signatures[0].protected).toBeDefined()
    expect(generalJws.signatures[0].signature).toBeDefined()
  })

  it('should produce flattened JWS JSON', async () => {
    const payload = { hello: 'world' }
    const token = new Token(payload)
    const certs = parseCerts(TEST_CERT)

    token.setProtectedHeader({
      alg: 'ES256',
      x5c: certs,
    })
    token.setUnprotectedHeader({ kid: 'unprotected-kid' })

    const signer = await ES256.getSigner(TEST_PRIVATE_KEY)
    await token.sign(signer)

    const flattened = token.toFlattenedJSON()
    expect(flattened.protected).toBeDefined()
    expect(flattened.payload).toBeDefined()
    expect(flattened.signature).toBeDefined()
    expect(flattened.header?.kid).toBe('unprotected-kid')
  })

  it('should throw when calling toString before signing', () => {
    const token = new Token({ data: 'test' })
    expect(() => token.toString()).toThrow(JAdESException)
  })
})

describe('JAdES Verifier', () => {
  it('should verify a valid compact JWS', async () => {
    const payload = { hello: 'world' }
    const token = new Token(payload)
    const certs = parseCerts(TEST_CERT)

    token.setProtectedHeader({
      alg: 'ES256',
      x5c: certs,
      kid: 'test-key',
    })

    const signer = await ES256.getSigner(TEST_PRIVATE_KEY)
    await token.sign(signer)
    const jws = token.toString()

    const verifier = await ES256.getVerifier(TEST_PUBLIC_KEY)
    const result = await verifyCompact(jws, verifier)

    expect(result.valid).toBe(true)
    expect(result.payload).toEqual(payload)
    expect(result.header.alg).toBe('ES256')
    expect(result.header.kid).toBe('test-key')
  })

  it('should reject invalid signature', async () => {
    const token = new Token({ data: 'test' })
    const certs = parseCerts(TEST_CERT)

    token.setProtectedHeader({
      alg: 'ES256',
      x5c: certs,
    })

    const signer = await ES256.getSigner(TEST_PRIVATE_KEY)
    await token.sign(signer)
    const jws = token.toString()

    // Use different key for verification
    const otherKeyPair = await ES256.generateKeyPair()
    const wrongVerifier = await ES256.getVerifier(otherKeyPair.publicKey)

    await expect(verifyCompact(jws, wrongVerifier)).rejects.toThrow('Invalid signature')
  })

  it('should decode JWS without verification', async () => {
    const payload = { hello: 'world' }
    const token = new Token(payload)
    const certs = parseCerts(TEST_CERT)

    token.setProtectedHeader({
      alg: 'ES256',
      x5c: certs,
    })

    const signer = await ES256.getSigner(TEST_PRIVATE_KEY)
    await token.sign(signer)
    const jws = token.toString()

    const decoded = decode(jws)
    expect(decoded.payload).toEqual(payload)
    expect(decoded.header.alg).toBe('ES256')
  })

  it('should verify using auto-detect function', async () => {
    const payload = { test: 'data' }
    const token = new Token(payload)
    const certs = parseCerts(TEST_CERT)

    token.setProtectedHeader({
      alg: 'ES256',
      x5c: certs,
    })

    const signer = await ES256.getSigner(TEST_PRIVATE_KEY)
    await token.sign(signer)
    const jws = token.toString()

    const verifier = await ES256.getVerifier(TEST_PUBLIC_KEY)
    const result = await verify(jws, verifier)

    expect(result.valid).toBe(true)
    expect(result.payload).toEqual(payload)
  })
})

describe('JAdES B-B Profile', () => {
  it('should create a basic JAdES B-B signature', async () => {
    const payload = {
      credentialSubject: {
        id: 'did:example:123',
        name: 'Test User',
      },
    }

    const token = new Token(payload)
    const certs = parseCerts(TEST_CERT)

    token
      .setProtectedHeader({ alg: 'ES256' })
      .setX5c(certs)
      .setKid('signer-key-2025')
      .setType('jades+json')
      .setSignedAt()

    const signer = await ES256.getSigner(TEST_PRIVATE_KEY)
    await token.sign(signer)

    const jws = token.toString()
    expect(jws).toBeDefined()

    // Verify the signature
    const verifier = await ES256.getVerifier(TEST_PUBLIC_KEY)
    const result = await verify(jws, verifier)

    expect(result.valid).toBe(true)
    expect(result.header.x5c).toEqual(certs)
    expect(result.header.kid).toBe('signer-key-2025')
  })
})
