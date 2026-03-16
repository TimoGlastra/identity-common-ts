/**
 * SchemaMeta SDK Types
 *
 * Based on TS11 specification for the EUDI Catalogue of Attestations.
 * Types are derived from Zod schemas in schemas.ts.
 *
 * @see https://github.com/eu-digital-identity-wallet/eudi-doc-standards-and-technical-specifications/blob/main/docs/technical-specifications/ts11-interfaces-and-formats-for-catalogue-of-attributes-and-catalogue-of-schemes.md
 */

import type { Signer } from '@owf/crypto'
import type { Verifier } from '@owf/identity-common'
import type { z } from 'zod'
import type {
  AttestationFormatSchema,
  AttestationLoSSchema,
  BindingTypeSchema,
  FrameworkTypeSchema,
  SchemaMetaSchema,
  SchemaURISchema,
  TrustAuthoritySchema,
} from './schemas'

// ============================================================================
// Enum Types
// ============================================================================

export type AttestationFormat = z.infer<typeof AttestationFormatSchema>
export type AttestationLoS = z.infer<typeof AttestationLoSSchema>
export type BindingType = z.infer<typeof BindingTypeSchema>
export type FrameworkType = z.infer<typeof FrameworkTypeSchema>

// ============================================================================
// Data Model Types
// ============================================================================

export type TrustAuthority = z.infer<typeof TrustAuthoritySchema>
export type SchemaURI = z.infer<typeof SchemaURISchema>
export type SchemaMeta = z.infer<typeof SchemaMetaSchema>

// ============================================================================
// Signed SchemaMeta Types
// ============================================================================

export interface SignOptions {
  schemaMeta: SchemaMeta
  keyId: string
  algorithm?: 'ES256' | 'ES384' | 'ES512' | 'RS256' | 'RS384' | 'RS512'
  certificates: string[]
  signer: Signer
}

export interface SignedSchemaMeta {
  jws: string
  header: {
    alg: string
    typ: string
    kid: string
    x5c: string[]
  }
  payload: SchemaMeta
}

// ============================================================================
// Verify Types
// ============================================================================

export interface VerifyOptions {
  jws: string
  verifier: Verifier
}

export interface VerifiedSchemaMeta {
  header: {
    alg: string
    typ: string
    kid: string
    x5c: string[]
  }
  payload: SchemaMeta
}
