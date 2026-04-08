import { type CredentialIssuerMetadata, zCredentialIssuerMetadataSchema } from '@openid4vc/openid4vci'
import z from 'zod'

const zCredentialIssuerMetadataWithMetadataUri = zCredentialIssuerMetadataSchema.extend({
  credential_metadata_uri: z.url().optional(),
})

/**
 *
 * Additional check for the Credential Issuer Metadata to see if there is a `credential_metadata_uri` available
 *
 */
export const parseCredentialMetadataUri = (cim: CredentialIssuerMetadata | Record<string, unknown>) =>
  zCredentialIssuerMetadataWithMetadataUri.parse(cim) as z.infer<typeof zCredentialIssuerMetadataWithMetadataUri> &
    CredentialIssuerMetadata

export type IssuerMetadataWithCredentialMetadataUri = ReturnType<typeof parseCredentialMetadataUri>
