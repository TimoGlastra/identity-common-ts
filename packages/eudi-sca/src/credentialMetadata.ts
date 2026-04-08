import z from 'zod'

export enum ValueType {
  Boolean = 'boolean',
  Frequency = 'frequency',
  Image = 'image',
  IsoDate = 'iso_date',
  IsoTime = 'iso_time',
  IsoDateTime = 'iso_date_time',
  IsoCurrency = 'iso_currency',
  IsoCurrencyAmount = 'iso_currency_amount',
  LabelOnly = 'label_only',
  MiniMarkdown = 'mini_markdown',
  Url = 'url',
}

const valueTypeValues = Object.values(ValueType).join('|')
const valueTypeRegex = new RegExp(`^template:(${valueTypeValues})$`)
const urnRegex = /^urn:eudi:sca:[^:]+:[^:]+(:[^:]+)*:[^:]+$/

const CredentialMetadataSchema = z.object({
  transaction_data_types: z.record(
    z.string().regex(urnRegex),
    z
      .object({
        claims: z.array(
          z
            .object({
              path: z.array(z.union([z.string(), z.null()])),
              mandatory: z.boolean().optional(),
              display: z
                .array(
                  z.object({
                    locale: z.string().optional(),
                    name: z.string(),
                    display_type: z.union([z.enum(ValueType), z.string().regex(valueTypeRegex)]).optional(),
                  })
                )
                .min(1)
                .optional(),
              value_type: z.union([z.enum(ValueType), z.string().regex(valueTypeRegex)]).optional(),
            })
            .superRefine((val, ctx) => {
              if (!val.display && val.value_type !== undefined) {
                ctx.addIssue({
                  code: 'custom',
                  message: 'value_type must not be used on claims without a display array',
                  path: ['value_type'],
                })
              }
            })
        ),
        ui_labels: z.unknown(),
      })
      .catchall(z.unknown())
  ),
})

export const parseCredentialMetadata = (credentialMetadata: Record<string, unknown>) => {
  const cm = CredentialMetadataSchema.parse(credentialMetadata)
  return cm
}
