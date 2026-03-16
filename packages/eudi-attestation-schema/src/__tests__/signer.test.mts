import { ES256, parseCertificate } from '@owf/crypto'
import { base64urlDecode } from '@owf/identity-common'
import { describe, expect, it } from 'vitest'
import { schemaMeta, schemaURI } from '../builders'
import { signSchemaMeta } from '../signer'

const TEST_CERT = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJALRiMLAh0ESOMA0GCSqGSIb3DQEBCwUAMBExDzANBgNVBAMMBnRl
c3RDQTAEFW0yNTAxMDEwMDAwMDBaFw0yNjAxMDEwMDAwMDBaMBExDzANBgNVBAMM
BnRlc3RDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABHlS+caJv1JJhqecjF8o
JwBz3GggPLgTTVOp8OZLuzwEN3YWYeEKjXlY5gC0V/pC8F5JuKlOGVTtsDNHJDRy
-----END CERTIFICATE-----`

describe('signSchemaMeta', () => {
  const buildTestMeta = () =>
    schemaMeta()
      .version('1.0.0')
      .rulebookURI('https://example.com/rulebook.md')
      .attestationLoS('iso_18045_basic')
      .bindingType('key')
      .addFormat('dc+sd-jwt')
      .addSchemaURI(schemaURI().format('dc+sd-jwt').uri('https://example.com/schema.json').build())
      .build()

  it('should produce a valid compact JWS', async () => {
    const { privateKey } = await ES256.generateKeyPair()
    const signer = await ES256.getSigner(privateKey)
    const meta = buildTestMeta()

    const signed = await signSchemaMeta({
      schemaMeta: meta,
      keyId: 'test-key-1',
      signer,
      certificates: [TEST_CERT],
    })

    expect(signed.jws).toBeDefined()
    const parts = signed.jws.split('.')
    expect(parts).toHaveLength(3)
  })

  it('should set correct header fields', async () => {
    const { privateKey } = await ES256.generateKeyPair()
    const signer = await ES256.getSigner(privateKey)
    const meta = buildTestMeta()

    const signed = await signSchemaMeta({
      schemaMeta: meta,
      keyId: 'catalog-signer-2025',
      signer,
      certificates: [TEST_CERT],
    })

    expect(signed.header.alg).toBe('ES256')
    expect(signed.header.typ).toBe('attestation-schema+jwt')
    expect(signed.header.kid).toBe('catalog-signer-2025')
    expect(signed.header.x5c).toEqual([parseCertificate(TEST_CERT)])
  })

  it('should encode the SchemaMeta as the JWS payload', async () => {
    const { privateKey } = await ES256.generateKeyPair()
    const signer = await ES256.getSigner(privateKey)
    const meta = buildTestMeta()

    const signed = await signSchemaMeta({
      schemaMeta: meta,
      keyId: 'test-key-1',
      signer,
      certificates: [TEST_CERT],
    })

    const [, payloadPart] = signed.jws.split('.')
    const decoded = JSON.parse(base64urlDecode(payloadPart))
    expect(decoded.version).toBe('1.0.0')
    expect(decoded.rulebookURI).toBe('https://example.com/rulebook.md')
    expect(decoded.attestationLoS).toBe('iso_18045_basic')
    expect(decoded.supportedFormats).toEqual(['dc+sd-jwt'])
  })

  it('should return the SchemaMeta in the payload field', async () => {
    const { privateKey } = await ES256.generateKeyPair()
    const signer = await ES256.getSigner(privateKey)
    const meta = buildTestMeta()

    const signed = await signSchemaMeta({
      schemaMeta: meta,
      keyId: 'test-key-1',
      signer,
      certificates: [TEST_CERT],
    })

    expect(signed.payload).toEqual(meta)
  })

  it('should produce a verifiable signature', async () => {
    const { privateKey, publicKey } = await ES256.generateKeyPair()
    const signer = await ES256.getSigner(privateKey)
    const verifier = await ES256.getVerifier(publicKey)
    const meta = buildTestMeta()

    const signed = await signSchemaMeta({
      schemaMeta: meta,
      keyId: 'test-key-1',
      signer,
      certificates: [TEST_CERT],
    })

    const [headerPart, payloadPart, signaturePart] = signed.jws.split('.')
    const signingInput = `${headerPart}.${payloadPart}`
    const isValid = await verifier(signingInput, signaturePart)
    expect(isValid).toBe(true)
  })
})
