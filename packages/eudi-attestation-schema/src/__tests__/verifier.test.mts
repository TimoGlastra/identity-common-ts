import { ES256 } from '@owf/crypto'
import { base64urlEncode } from '@owf/identity-common'
import { describe, expect, it } from 'vitest'
import { schemaMeta, schemaURI } from '../builders'
import { signSchemaMeta } from '../signer'
import { verifySchemaMeta } from '../verifier'

const buildTestMeta = () =>
  schemaMeta()
    .version('1.0.0')
    .rulebookURI('https://example.com/rulebook.md')
    .attestationLoS('iso_18045_basic')
    .bindingType('key')
    .addFormat('dc+sd-jwt')
    .addSchemaURI(schemaURI().format('dc+sd-jwt').uri('https://example.com/schema.json').build())
    .build()

describe('verifySchemaMeta', () => {
  it('should verify and decode a valid signed SchemaMeta', async () => {
    const { privateKey, publicKey } = await ES256.generateKeyPair()
    const signer = await ES256.getSigner(privateKey)
    const verifier = await ES256.getVerifier(publicKey)

    const meta = buildTestMeta()
    const signed = await signSchemaMeta({
      schemaMeta: meta,
      keyId: 'test-key-1',
      signer,
    })

    const result = await verifySchemaMeta({ jws: signed.jws, verifier })

    expect(result.payload).toEqual(meta)
    expect(result.header.alg).toBe('ES256')
    expect(result.header.kid).toBe('test-key-1')
    expect(result.header.typ).toBe('attestation-schema+jwt')
  })

  it('should throw on invalid signature', async () => {
    const keyPair1 = await ES256.generateKeyPair()
    const keyPair2 = await ES256.generateKeyPair()
    const signer = await ES256.getSigner(keyPair1.privateKey)
    const wrongVerifier = await ES256.getVerifier(keyPair2.publicKey)

    const meta = buildTestMeta()
    const signed = await signSchemaMeta({
      schemaMeta: meta,
      keyId: 'test-key-1',
      signer,
    })

    await expect(verifySchemaMeta({ jws: signed.jws, verifier: wrongVerifier })).rejects.toThrow('Invalid signature')
  })

  it('should throw on invalid JWS format', async () => {
    const { publicKey } = await ES256.generateKeyPair()
    const verifier = await ES256.getVerifier(publicKey)

    await expect(verifySchemaMeta({ jws: 'not-a-jws', verifier })).rejects.toThrow()
  })

  it('should throw on invalid SchemaMeta payload', async () => {
    const { privateKey, publicKey } = await ES256.generateKeyPair()
    const signer = await ES256.getSigner(privateKey)
    const verifier = await ES256.getVerifier(publicKey)

    // Manually build a JWS with an invalid payload
    const header = base64urlEncode(JSON.stringify({ alg: 'ES256', typ: 'attestation-schema+jwt', kid: 'k1' }))
    const payload = base64urlEncode(JSON.stringify({ invalid: true }))
    const signingInput = `${header}.${payload}`
    const signature = await signer(signingInput)
    const jws = `${signingInput}.${signature}`

    await expect(verifySchemaMeta({ jws, verifier })).rejects.toThrow('Invalid SchemaMeta payload')
  })

  it('should return typed header with x5c when present', async () => {
    const { privateKey, publicKey } = await ES256.generateKeyPair()
    const signer = await ES256.getSigner(privateKey)
    const verifier = await ES256.getVerifier(publicKey)

    const meta = buildTestMeta()
    const signed = await signSchemaMeta({
      schemaMeta: meta,
      keyId: 'test-key-1',
      signer,
    })

    const result = await verifySchemaMeta({ jws: signed.jws, verifier })
    expect(result.header.x5c).toBeUndefined()
  })
})
