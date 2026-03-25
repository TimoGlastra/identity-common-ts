import { expect, suite, test } from 'vitest'
import { AmrInherence, AmrKnowledge } from '../../presentationResponse/amr'
import { createScaPresentationResponseKeyBindingClaims } from '../../presentationResponse/sdJwtVc'
import { hasher, jtiGenerator } from '../utils'

suite('sdJwtVc', () => {
  test('create sca presentation response kb-jwt claims', () => {
    const keyBindingClaims = createScaPresentationResponseKeyBindingClaims({
      jti: jtiGenerator(),
      hasher,
      responseMode: 'query',
      amr: [{ inherence: AmrInherence.Other }, { knowledge: AmrKnowledge.Other }],
      displayLocale: 'en-GB',
      transactionData: 'ey',
      metadataIntegrity: 'sha256-abc',
    })

    expect(keyBindingClaims).toStrictEqual({
      jti: expect.any(String),
      response_mode: 'query',
      amr: [{ inherence: AmrInherence.Other }, { knowledge: AmrKnowledge.Other }],
      display_locale: 'en-GB',
      metadata_integrity: 'sha256-abc',
      transaction_data_hash: expect.any(String),
      transaction_data_hash_alg: 'sha256',
    })
  })
})
