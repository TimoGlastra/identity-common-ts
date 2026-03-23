/**
 * @owf/eudi-jades
 *
 * JAdES (JSON Advanced Electronic Signatures) implementation
 * based on ETSI TS 119 182-1 standard.
 *
 * Supports the following JAdES baseline profiles:
 * - B-B (Basic - Baseline): Basic signature format
 * - B-T (Basic with Time): Signatures with timestamp
 * - B-LT (Basic Long-Term): Signatures with validation data
 * - B-LTA (Basic Long-Term with Archive timestamps)
 *
 * @packageDocumentation
 */

// Constants
export { ALGORITHMS, CommitmentOIDs, CRITICAL_PARAMETERS, DETACHED_MECHANISM_IDS, JAdESProfile } from './constants'
// Exception
export { JAdESException } from './jades-exception'
// Zod Schemas
export {
  ArcTstSchema,
  CompactJWSSchema,
  EtsiUSchema,
  FlattenedJWSSchema,
  GeneralJWSSchema,
  ProtectedHeaderForSigningSchema,
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
// Main Token class
export { Token } from './token'
// Types
export type {
  ArcTst,
  CommitmentReference,
  CompactJWS,
  EtsiU,
  GeneralJWS,
  ProtectedHeaderParams,
  RVals,
  SigD,
  SignAlg,
  SignaturePolicy,
  SignerIdentifier,
  SignOptions,
  SigTst,
  TstTokens,
  UnprotectedHeaderParams,
  VerifyOptions,
  X5tO,
  XVals,
} from './types'
// Utility functions
export {
  decodeJSON,
  encodeJSON,
  generateKid,
  generateSigX5ts,
  generateX5c,
  generateX5tO,
  generateX5tS256,
  getSigningTime,
  parseCerts,
  validateCertificateHeaders,
} from './utils'
export type { VerifyResult } from './verifier'
// Verifier functions
export { decode, verify, verifyCompact, verifyGeneral } from './verifier'
