// Builders
export {
  SchemaMetaBuilder,
  SchemaURIBuilder,
  schemaMeta,
  schemaURI,
  TrustAuthorityBuilder,
  trustAuthority,
} from './builders'

// Exception
export { SchemaMetaException } from './schema-meta-exception'

// Schemas
export {
  AttestationFormatSchema,
  AttestationFormatValues,
  AttestationLoSSchema,
  AttestationLoSValues,
  BindingTypeSchema,
  BindingTypeValues,
  FrameworkTypeSchema,
  FrameworkTypeValues,
  GenericMetaSchema,
  MsoMdocMetaSchema,
  SchemaMetaSchema,
  SchemaURISchema,
  SdJwtMetaSchema,
  TrustAuthoritySchema,
} from './schemas'

// Signer
export { signSchemaMeta } from './signer'

// Types
export type {
  AttestationFormat,
  AttestationLoS,
  BindingType,
  FrameworkType,
  GenericMeta,
  MsoMdocMeta,
  SchemaMeta,
  SchemaURI,
  SchemaURIMeta,
  SdJwtMeta,
  SignedSchemaMeta,
  SignOptions,
  TrustAuthority,
  VerifiedSchemaMeta,
  VerifyOptions,
} from './types'
// Validator
export type { ValidationError, ValidationResult } from './validator'
export { assertValidSchemaMeta, validateSchemaMeta } from './validator'
// Verifier
export { verifySchemaMeta } from './verifier'
