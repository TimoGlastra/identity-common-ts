import { z } from 'zod'

const ValueType = z.enum([
  'boolean',
  'frequency',
  'image',
  'iso_date',
  'iso_time',
  'iso_date_time',
  'iso_currency',
  'iso_currency_amount',
  'label_only',
  'mini_markdown',
  'url',
])

const ClaimDisplayEntry = z.object({
  locale: z.string().optional(),
  label: z.string(),
  description: z.string().optional(),
})

const Claim = z.object({
  path: z.array(z.string()),
  mandatory: z.boolean().optional(),
  value_type: ValueType.optional(),
  label_type: ValueType.optional(),

  display: z.array(ClaimDisplayEntry).optional(),
})

const UiLabelEntry = z.object({
  locale: z.string().optional(),
  value: z.string(),
})

const UiLabels = z
  .object({
    affirmative_action_label: z.array(UiLabelEntry),
    denial_action_label: z.array(UiLabelEntry).optional(),
    transaction_title: z.array(UiLabelEntry).optional(),
    security_hint: z.array(UiLabelEntry).optional(),
  })
  .catchall(z.array(UiLabelEntry))

const TransactionDataTypeValue = z.object({
  claims: z.array(Claim),
  ui_labels: UiLabels,
})

export const TransactionDataTypesSchema = z.record(
  z
    .string()
    .regex(
      /^urn:eudi:sca:[a-z0-9]+(?:\.[a-z0-9]+)*(?::[a-z0-9A-Z0-9_-]+)+$/,
      'Must follow urn:eudi:sca:<org-identifier>:<code>[:<subcode>]*:<version>'
    ),
  TransactionDataTypeValue
)

export type TransactionDataTypes = z.infer<typeof TransactionDataTypesSchema>
