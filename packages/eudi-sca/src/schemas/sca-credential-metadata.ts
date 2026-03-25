import z from 'zod'
import { TransactionDataTypesSchema } from './transaction-data-types'

export const SCA_CREDENTIAL_METADATA_CATEGORY = 'urn:eudi:category:sua:sca'

export const zScaCredentialMetadataSchema = z.object({
  category: z.literal(SCA_CREDENTIAL_METADATA_CATEGORY),
  transaction_data_types: TransactionDataTypesSchema,
})

export type ScaCredentialMetadata = z.infer<typeof zScaCredentialMetadataSchema>
