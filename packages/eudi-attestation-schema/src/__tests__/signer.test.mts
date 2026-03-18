import { ES256, parseCertificate } from '@owf/crypto'
import { base64urlDecode } from '@owf/identity-common'
import { describe, expect, it } from 'vitest'
import { schemaMeta, schemaURI } from '../builders'
import { signSchemaMeta } from '../signer'

// Self-signed EC P-256 certificate and matching key pair (generated via openssl)
const TEST_CERT = `-----BEGIN CERTIFICATE-----
MIICNzCCAdygAwIBAgIJAOGdPeamaE3SMAoGCCqGSM49BAMCMCgxCzAJBgNVBAYT
AkRFMRkwFwYDVQQDDBBHZXJtYW4gUmVnaXN0cmFyMB4XDTI2MDMxNzA3MDIxMloX
DTI3MDMxNzA3MDIxMlowTTELMAkGA1UEBhMCREUxDzANBgNVBAoMBnNwcmluZDEc
MBoGA1UEYQwTREUuRTMxODUwNDlCRUQ3Q0ZCMjEPMA0GA1UEAwwGc3ByaW5kMFkw
EwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEmulYlr6FP7jmYgR6hVixP7Pt07Niul0/
cdkvmm1M/8buPA5z/Hi/PQ0EUvEyFHsGW1vh+hgbshSYxv5krqiX/qOByTCBxjAM
BgNVHRMBAf8EAjAAMB0GA1UdDgQWBBQUMoFYXxoZZ4NNAemECFZez38nUDAfBgNV
HSMEGDAWgBT+JducU3pQJ7A5BOgKnrDrMM6mJTAOBgNVHQ8BAf8EBAMCB4AwEgYD
VR0lBAswCQYHKIGMXQUBBjAUBgNVHREEDTALgglsb2NhbGhvc3QwPAYDVR0fBDUw
MzAxoC+gLYYraHR0cDovL2xvY2FsaG9zdDozMDAxL3N0YXR1cy1tYW5hZ2VtZW50
L2NybDAKBggqhkjOPQQDAgNJADBGAiEAxTd9TRnV/9/x1mUAJPVsi1LB8hlhu1Zm
/0S6yOMPb1UCIQDtKRVJQ16FQFu8NT4eCRhLFp8FcTdPHA1M9OUIPUo19g==
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

describe('signSchemaMeta', () => {
  const buildTestMeta = () =>
    schemaMeta()
      .id('https://example.com/schema/123')
      .version('1.0.0')
      .rulebookURI('https://example.com/rulebook.md')
      .attestationLoS('iso_18045_basic')
      .bindingType('key')
      .addFormat('dc+sd-jwt')
      .addSchemaURI(schemaURI().format('dc+sd-jwt').uri('https://example.com/schema.json').build())
      .build()

  it('should produce a valid compact JWS', async () => {
    const signer = await ES256.getSigner(TEST_PRIVATE_KEY)
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
    expect(signed.iat).toBeTypeOf('number')
    expect(signed.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000))
  })

  it('should set correct header fields', async () => {
    const signer = await ES256.getSigner(TEST_PRIVATE_KEY)
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
    const signer = await ES256.getSigner(TEST_PRIVATE_KEY)
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
    expect(decoded.iat).toBeTypeOf('number')
  })

  it('should return the SchemaMeta in the payload field', async () => {
    const signer = await ES256.getSigner(TEST_PRIVATE_KEY)
    const meta = buildTestMeta()

    const signed = await signSchemaMeta({
      schemaMeta: meta,
      keyId: 'test-key-1',
      signer,
      certificates: [TEST_CERT],
    })

    console.log(signed.jws)

    expect(signed.payload).toEqual(meta)
  })

  it('should produce a verifiable signature', async () => {
    const signer = await ES256.getSigner(TEST_PRIVATE_KEY)
    const verifier = await ES256.getVerifier(TEST_PUBLIC_KEY)
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
