import { expect, suite, test } from 'vitest'
import { TransactionDataTypesSchema } from '../../schemas/transaction-data-types'

suite('transaction-data-types-schema', () => {
  test('parse a valid transaction data types object from the credential_metadata', () => {
    const transactionDataTypes = {
      'urn:eudi:sca:eu.europa.ec:payment:single:1': {
        claims: [
          {
            path: ['payee', 'name'],
            mandatory: true,
            display: [
              { locale: 'de-DE', label: 'Empfänger' },
              { locale: 'en-GB', label: 'Payee' },
            ],
          },
          { path: ['payee', 'id'], mandatory: true },
          {
            path: ['amount'],
            mandatory: true,
            value_type: 'iso_currency_amount',
            display: [
              { locale: 'de-DE', label: 'Betrag' },
              { locale: 'en-GB', label: 'Amount' },
            ],
          },
          { path: ['transaction_id'], mandatory: true },
          {
            path: ['date_time'],
            value_type: 'iso_date_time',
            display: [
              { locale: 'de-DE', label: 'Datum' },
              { locale: 'en-GB', label: 'Date' },
            ],
          },
        ],
        ui_labels: {
          affirmative_action_label: [
            { locale: 'de-DE', value: 'Zahlung bestätigen' },
            { locale: 'en-GB', value: 'Confirm Payment' },
          ],
        },
      },
    }

    const parsed = TransactionDataTypesSchema.parse(transactionDataTypes)

    expect(parsed).toStrictEqual(transactionDataTypes)
  })

  test('parse two valid transaction data types object from the credential_metadata', () => {
    const transactionDataTypes = {
      'urn:eudi:sca:eu.europa.ec:payment:single:1': {
        claims: [],
        ui_labels: {
          affirmative_action_label: [{ locale: 'en-GB', value: 'Confirm Payment' }],
        },
      },
      'urn:eudi:sca:eu.europa.ec:payment:recurring:2': {
        claims: [],
        ui_labels: {
          affirmative_action_label: [{ locale: 'en-GB', value: 'Confirm Payment' }],
        },
      },
    }

    const parsed = TransactionDataTypesSchema.parse(transactionDataTypes)

    expect(parsed).toStrictEqual(transactionDataTypes)
  })

  test('parse an invalid transaction data types object with invalid specifier', () => {
    const transactionDataTypes = {
      NOT_URN: {
        claims: [],
        ui_labels: {
          affirmative_action_label: [
            { locale: 'de-DE', value: 'Zahlung bestätigen' },
            { locale: 'en-GB', value: 'Confirm Payment' },
          ],
        },
      },
    }

    expect(() => TransactionDataTypesSchema.parse(transactionDataTypes)).toThrow()
  })

  test('parse an invalid transaction data types object missing claims', () => {
    const transactionDataTypes = {
      'urn:eudi:sca:eu.europa.ec:payment:single:1': {
        ui_labels: {
          affirmative_action_label: [
            { locale: 'de-DE', value: 'Zahlung bestätigen' },
            { locale: 'en-GB', value: 'Confirm Payment' },
          ],
        },
      },
    }

    expect(() => TransactionDataTypesSchema.parse(transactionDataTypes)).toThrow()
  })

  test('parse an invalid transaction data types object missing ui_labels', () => {
    const transactionDataTypes = {
      'urn:eudi:sca:eu.europa.ec:payment:single:1': {
        claims: [],
      },
    }

    expect(() => TransactionDataTypesSchema.parse(transactionDataTypes)).toThrow()
  })

  test('parse an invalid transaction data types object missing affirmative_action_label', () => {
    const transactionDataTypes = {
      'urn:eudi:sca:eu.europa.ec:payment:single:1': {
        claims: [],
        ui_labels: {},
      },
    }

    expect(() => TransactionDataTypesSchema.parse(transactionDataTypes)).toThrow()
  })

  test('parse multiple, one valid and one invalid, transaction data types object', () => {
    const transactionDataTypes = {
      'urn:eudi:sca:eu.europa.ec:payment:single:1': {
        claims: [],
        ui_labels: {
          affirmative_action_label: [
            { locale: 'de-DE', value: 'Zahlung bestätigen' },
            { locale: 'en-GB', value: 'Confirm Payment' },
          ],
        },
      },
      'urn:eudi:sca:eu.europa.ec:payment:recurring:1': {
        claims: ['INVALID'],
        ui_labels: {
          affirmative_action_label: [
            { locale: 'de-DE', value: 'Zahlung bestätigen' },
            { locale: 'en-GB', value: 'Confirm Payment' },
          ],
        },
      },
    }

    expect(() => TransactionDataTypesSchema.parse(transactionDataTypes)).toThrow()
  })
})
