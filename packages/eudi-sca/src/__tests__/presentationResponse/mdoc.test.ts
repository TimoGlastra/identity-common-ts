import { expect, suite, test } from 'vitest'
import { AmrInherence, AmrKnowledge } from '../../presentationResponse/amr'
import { createScaPresentationResponseDeviceNamespaces } from '../../presentationResponse/mdoc'
import { hasher, jtiGenerator } from '../utils'

suite('mdoc', () => {
  test('create sca presentation response device namespaces', () => {
    const deviceNamespaces = createScaPresentationResponseDeviceNamespaces({
      jti: jtiGenerator(),
      hasher,
      responseMode: 'query',
      amr: [{ inherence: AmrInherence.Other }, { knowledge: AmrKnowledge.Other }],
      displayLocale: 'en-GB',
      transactionData: 'ey',
      metadataIntegrity: 'sha256-abc',
    })

    expect(deviceNamespaces['eu.eudiw.sca']).toStrictEqual({
      jti: expect.any(String),
      response_mode: 'query',
      amr: expect.any(Uint8Array),
      display_locale: 'en-GB',
      metadata_integrity: 'sha256-abc',
      transaction_data_hash: expect.any(String),
      transaction_data_hash_alg: 'sha256',
    })
  })
})
