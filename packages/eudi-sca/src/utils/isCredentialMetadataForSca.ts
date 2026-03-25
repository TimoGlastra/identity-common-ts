import {
  SCA_CREDENTIAL_METADATA_CATEGORY,
  type ScaCredentialMetadata,
  zScaCredentialMetadataSchema,
} from '../schemas/sca-credential-metadata'

export type CredentialMetadata =
  | {
      category: string
    }
  | ScaCredentialMetadata

export const isCredentialMetadataForSca = (
  credentialMetadata: CredentialMetadata
): credentialMetadata is ScaCredentialMetadata => {
  try {
    return (
      credentialMetadata.category === SCA_CREDENTIAL_METADATA_CATEGORY &&
      !!zScaCredentialMetadataSchema.parse(credentialMetadata)
    )
  } catch {
    return false
  }
}
