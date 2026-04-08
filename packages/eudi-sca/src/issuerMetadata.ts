import type { CredentialIssuerMetadata } from '@openid4vc/openid4vci'
import z from 'zod'

const zCredentialIssuerMetadataWithMetadataUri = z.looseObject({
  credential_metadata_uri: z.url().optional(),
})

/**
 *
 * Additional check for the Credential Issuer Metadata to see if there is a `credential_metadata_uri` available
 * Make sure the full issuer metadata has been validated by a library like `openi4vc/openid4vci`
 *
 */
export const parseCredentialMetadataUri = (cim: CredentialIssuerMetadata) =>
  zCredentialIssuerMetadataWithMetadataUri.parse(cim) as z.infer<typeof zCredentialIssuerMetadataWithMetadataUri> &
    CredentialIssuerMetadata
