import { expect, suite, test } from 'vitest'
import { isCredentialMetadataForSca } from '../../utils/isCredentialMetadataForSca'

suite('isCredentialMetadataForSca', () => {
  test('parse a valid credential metadata and check type assertion', () => {
    const credentialMetadata = {
      category: 'urn:eudi:category:sua:sca',
      display: [{ name: 'pay.example Payment Credential', locale: 'en' }],
      transaction_data_types: {
        'urn:eudi:sca:eu.europa.ec:payment:recurring:1': {
          claims: [],
          ui_labels: {
            affirmative_action_label: [{ locale: 'en-GB', value: 'Confirm Payment' }],
          },
        },
      },
    }

    expect(isCredentialMetadataForSca(credentialMetadata)).toBeTruthy()

    // Should not have any type issues as the check above asserts it to be true
    expect(credentialMetadata.transaction_data_types).toStrictEqual(credentialMetadata.transaction_data_types)
    // Check whether display is passed through
    expect(credentialMetadata.display).toStrictEqual(credentialMetadata.display)
  })

  test('parse an invalid credential metadata with incorrect category', () => {
    const credentialMetadata = {
      category: 'not-a-payment',
      display: [{ name: 'pay.example Payment Credential', locale: 'en' }],
      transaction_data_types: {
        'urn:eudi:sca:eu.europa.ec:payment:recurring:1': {
          claims: [],
          ui_labels: {
            affirmative_action_label: [{ locale: 'en-GB', value: 'Confirm Payment' }],
          },
        },
      },
    }

    expect(isCredentialMetadataForSca(credentialMetadata)).toBeFalsy()
  })

  test('parse an invalid credential metadata with missing transaction_data_types', () => {
    const credentialMetadata = {
      category: 'urn:eudi:category:sua:sca',
      display: [{ name: 'pay.example Payment Credential', locale: 'en' }],
    }

    expect(isCredentialMetadataForSca(credentialMetadata)).toBeFalsy()
  })
})
