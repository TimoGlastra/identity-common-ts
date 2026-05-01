/**
 * JAdES Type Definitions
 *
 * Types derived from Zod schemas as per ETSI TS 119 182-1 standard.
 * @see schemas.ts for schema definitions
 */

import type { z } from 'zod'
import type { CommitmentOIDs } from './constants'
import type {
  ArcTstSchema,
  CompactJWSSchema,
  EtsiUSchema,
  GeneralJWSSchema,
  ProtectedHeaderSchema,
  RValsSchema,
  SigDSchema,
  SignAlgSchema,
  SignaturePolicySchema,
  SignerIdentifierSchema,
  SignOptionsSchema,
  SigTstSchema,
  TstTokensSchema,
  UnprotectedHeaderSchema,
  X5tOSchema,
  XValsSchema,
} from './schemas'

/**
 * Supported signature algorithms.
 */
export type SignAlg = z.infer<typeof SignAlgSchema>

/**
 * X.509 Certificate Thumbprint with algorithm specification.
 */
export type X5tO = z.infer<typeof X5tOSchema>

/**
 * Commitment reference as per ETSI TS 119 182-1 Section 5.2.5.
 */
export interface CommitmentReference {
  /** Commitment type identifier (OID or URI) */
  commId: string | CommitmentOIDs
  /** Commitment qualifiers */
  commQuals?: object[]
}

/**
 * Signature policy descriptor.
 */
export type SignaturePolicy = z.infer<typeof SignaturePolicySchema>

/**
 * Signer identifier.
 */
export type SignerIdentifier = z.infer<typeof SignerIdentifierSchema>

/**
 * Detached signature descriptor - ETSI TS 119 182-1 Section 5.2.8.
 */
export type SigD = z.infer<typeof SigDSchema>

/**
 * JAdES Protected Header parameters as per ETSI TS 119 182-1.
 */
export type ProtectedHeaderParams = z.infer<typeof ProtectedHeaderSchema>

/**
 * JAdES Unprotected Header parameters.
 */
export type UnprotectedHeaderParams = z.infer<typeof UnprotectedHeaderSchema>

/**
 * ETSI Unsigned properties for different JAdES profiles.
 */
export type EtsiU = z.infer<typeof EtsiUSchema>

/**
 * Signature timestamp container.
 */
export type SigTst = z.infer<typeof SigTstSchema>

/**
 * Timestamp tokens container.
 */
export type TstTokens = z.infer<typeof TstTokensSchema>

/**
 * X.509 certificate values for B-LT profile.
 */
export type XVals = z.infer<typeof XValsSchema>

/**
 * Revocation values (CRL and OCSP) for B-LT profile.
 */
export type RVals = z.infer<typeof RValsSchema>

/**
 * Archive timestamp for B-LTA profile.
 */
export type ArcTst = z.infer<typeof ArcTstSchema>

/**
 * General JWS structure with multiple signatures.
 */
export type GeneralJWS = z.infer<typeof GeneralJWSSchema>

/**
 * Compact JWS representation.
 */
export type CompactJWS = z.infer<typeof CompactJWSSchema>

/**
 * Sign options for JAdES signing.
 */
export type SignOptions = z.infer<typeof SignOptionsSchema> & {
  /** Signer function */
  signer: (data: string) => Promise<string>
}

/**
 * Verify options for JAdES verification.
 */
export interface VerifyOptions {
  /** Verifier function */
  verifier: (data: string, signature: string) => Promise<boolean>
}
