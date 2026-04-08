import { expect, suite, test } from 'vitest'
import { ZodError } from 'zod'
import { parseCredentialMetadata } from '../credentialMetadata'

export const credential_metadata = {
  transaction_data_types: {
    'urn:eudi:sca:eu.europa.ec:payment:single:1': {
      claims: [
        {
          path: ['transaction_id'],
          mandatory: true,
        },
        {
          path: ['amount'],
          mandatory: true,
          value_type: 'iso_currency_amount',
          display: [
            { locale: 'en', name: 'amount' },
            { locale: 'de', name: 'betrag' },
          ],
        },
        {
          path: ['amount_estimated'],
          value_type: 'label_only',
          display: [
            { locale: 'en', name: 'amount is estimated' },
            { locale: 'de', name: 'betrag ist geschätzt' },
          ],
        },
        {
          path: ['amount_earmarked'],
          value_type: 'label_only',
          display: [
            { locale: 'en', name: 'amount earmarked immediately' },
            { locale: 'de', name: 'betrag sofort reserviert' },
          ],
        },
        {
          path: ['payee', 'name'],
          mandatory: true,
          display: [
            { locale: 'en', name: 'payee' },
            { locale: 'de', name: 'empfänger' },
          ],
        },
        {
          path: ['payee', 'id'],
          mandatory: true,
        },
        {
          path: ['payee', 'logo'],
          value_type: 'image',
          display: [
            { locale: 'en', name: 'payee logo' },
            { locale: 'de', name: 'empfänger-logo' },
          ],
        },
        {
          path: ['payee', 'logo#integrity'],
        },
        {
          path: ['payee', 'website'],
          value_type: 'url',
          display: [
            { locale: 'en', name: 'website' },
            { locale: 'de', name: 'webseite' },
          ],
        },
        {
          path: ['remittance_info'],
          display: [
            { locale: 'en', name: 'reference' },
            { locale: 'de', name: 'verwendungszweck' },
          ],
        },
        {
          path: ['execution_date'],
          value_type: 'iso_date',
          display: [
            { locale: 'en', name: 'execution date' },
            { locale: 'de', name: 'ausführungsdatum' },
          ],
        },
        {
          path: ['date_time'],
          value_type: 'iso_date_time',
          display: [
            { locale: 'en', name: 'initiated' },
            { locale: 'de', name: 'eingeleitet' },
          ],
        },
      ],
      ui_labels: {
        affirmative_action_label: [
          { locale: 'en', value: 'Confirm Payment' },
          { locale: 'de', value: 'Zahlung bestätigen' },
        ],
        denial_action_label: [
          { locale: 'en', value: 'Cancel' },
          { locale: 'de', value: 'Abbrechen' },
        ],
        transaction_title: [
          { locale: 'en', value: 'Payment Confirmation' },
          { locale: 'de', value: 'Zahlungsbestätigung' },
        ],
        security_hint: [
          { locale: 'en', value: 'Verify that the payee name matches the intended recipient' },
          { locale: 'de', value: 'Prüfen Sie, ob der Empfängername mit dem beabsichtigten Empfänger übereinstimmt' },
        ],
      },
    },
  },
}

suite('credential metadata', () => {
  test('parse valid credential metadata', () => {
    const credentialMetadata = parseCredentialMetadata(credential_metadata)
    expect(credentialMetadata).toMatchObject(credential_metadata)
  })

  test('parse invalid credential metadata with incorrect key', () => {
    expect(() =>
      parseCredentialMetadata({
        transaction_data_types: {
          'invalid:urn:key': credential_metadata.transaction_data_types['urn:eudi:sca:eu.europa.ec:payment:single:1'],
        },
      })
    ).toThrow(ZodError)
  })

  test('parse invalid credential metadata with incorrect value_type', () => {
    const invalidCm = credential_metadata
    invalidCm.transaction_data_types['urn:eudi:sca:eu.europa.ec:payment:single:1'].claims[0].value_type = 'invalid'
    expect(() => parseCredentialMetadata(invalidCm)).toThrow(ZodError)
  })
})
