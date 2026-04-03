/**
 * JAdES Profile Validation
 *
 * Utilities for validating JAdES signatures against baseline profiles
 * as per ETSI TS 119 182-1.
 */

import { JAdESProfile } from './constants'
import type { GeneralJWS, ProtectedHeaderParams, UnprotectedHeaderParams } from './types'

/**
 * Result of profile validation.
 */
export interface ProfileValidationResult {
  /** Whether the signature satisfies the profile requirements */
  valid: boolean
  /** Missing requirements if validation failed */
  missing?: string[]
}

/**
 * Check if an etsiU array contains an element with the specified key.
 */
function hasEtsiUElement(
  etsiU: unknown[] | undefined,
  key: 'sigTst' | 'xVals' | 'rVals' | 'arcTst'
): boolean {
  if (!etsiU || !Array.isArray(etsiU)) return false
  return etsiU.some((item) => typeof item === 'object' && item !== null && key in item)
}

/**
 * Validate B-B (Basic - Baseline) profile requirements.
 *
 * Requirements:
 * - alg (signature algorithm) present
 * - At least one certificate header (x5t#S256, x5c, x5t#o, sigX5ts)
 * - sigT (signing time) present
 */
function validateBB(header: ProtectedHeaderParams): ProfileValidationResult {
  const missing: string[] = []

  if (!header.alg) {
    missing.push('alg (signature algorithm)')
  }

  const hasCertHeader = !!(header['x5t#S256'] || header.x5c || header['x5t#o'] || header.sigX5ts)
  if (!hasCertHeader) {
    missing.push('certificate header (x5t#S256, x5c, x5t#o, or sigX5ts)')
  }

  if (!header.sigT) {
    missing.push('sigT (signing time)')
  }

  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined,
  }
}

/**
 * Validate B-T (Basic with Time) profile requirements.
 *
 * Requirements:
 * - All B-B requirements
 * - sigTst (signature timestamp) in etsiU
 */
function validateBT(
  header: ProtectedHeaderParams,
  unprotectedHeader?: UnprotectedHeaderParams
): ProfileValidationResult {
  const bbResult = validateBB(header)
  const missing = bbResult.missing ? [...bbResult.missing] : []

  const etsiU = unprotectedHeader?.etsiU as unknown[] | undefined
  if (!hasEtsiUElement(etsiU, 'sigTst')) {
    missing.push('sigTst (signature timestamp) in etsiU')
  }

  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined,
  }
}

/**
 * Validate B-LT (Basic Long-Term) profile requirements.
 *
 * Requirements:
 * - All B-T requirements
 * - xVals (certificate values) in etsiU
 * - rVals (revocation values) in etsiU
 */
function validateBLT(
  header: ProtectedHeaderParams,
  unprotectedHeader?: UnprotectedHeaderParams
): ProfileValidationResult {
  const btResult = validateBT(header, unprotectedHeader)
  const missing = btResult.missing ? [...btResult.missing] : []

  const etsiU = unprotectedHeader?.etsiU as unknown[] | undefined
  if (!hasEtsiUElement(etsiU, 'xVals')) {
    missing.push('xVals (certificate values) in etsiU')
  }
  if (!hasEtsiUElement(etsiU, 'rVals')) {
    missing.push('rVals (revocation values) in etsiU')
  }

  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined,
  }
}

/**
 * Validate B-LTA (Basic Long-Term with Archive timestamps) profile requirements.
 *
 * Requirements:
 * - All B-LT requirements
 * - arcTst (archive timestamp) in etsiU
 */
function validateBLTA(
  header: ProtectedHeaderParams,
  unprotectedHeader?: UnprotectedHeaderParams
): ProfileValidationResult {
  const bltResult = validateBLT(header, unprotectedHeader)
  const missing = bltResult.missing ? [...bltResult.missing] : []

  const etsiU = unprotectedHeader?.etsiU as unknown[] | undefined
  if (!hasEtsiUElement(etsiU, 'arcTst')) {
    missing.push('arcTst (archive timestamp) in etsiU')
  }

  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined,
  }
}

/**
 * Validate that a JAdES signature meets the requirements for a specific profile.
 *
 * @param header - Protected header parameters
 * @param profile - Target JAdES profile to validate
 * @param unprotectedHeader - Optional unprotected header (required for B-T, B-LT, B-LTA)
 * @returns Validation result with any missing requirements
 *
 * @example
 * ```typescript
 * import { validateProfile, JAdESProfile, decode } from '@owf/eudi-jades'
 *
 * const { header, unprotectedHeader } = decode(jws)
 * const result = validateProfile(header, JAdESProfile.B_T, unprotectedHeader)
 *
 * if (result.valid) {
 *   console.log('Signature meets B-T profile requirements')
 * } else {
 *   console.log('Missing:', result.missing)
 * }
 * ```
 */
export function validateProfile(
  header: ProtectedHeaderParams,
  profile: JAdESProfile,
  unprotectedHeader?: UnprotectedHeaderParams
): ProfileValidationResult {
  switch (profile) {
    case JAdESProfile.B_B:
      return validateBB(header)
    case JAdESProfile.B_T:
      return validateBT(header, unprotectedHeader)
    case JAdESProfile.B_LT:
      return validateBLT(header, unprotectedHeader)
    case JAdESProfile.B_LTA:
      return validateBLTA(header, unprotectedHeader)
    default:
      return {
        valid: false,
        missing: [`Unknown profile: ${profile}`],
      }
  }
}

/**
 * Detect which JAdES profiles a signature satisfies.
 *
 * Returns all profiles the signature meets (e.g., a B-LT signature
 * also satisfies B-B and B-T requirements).
 *
 * @param header - Protected header parameters
 * @param unprotectedHeader - Optional unprotected header
 * @returns Array of satisfied profiles (highest to lowest)
 *
 * @example
 * ```typescript
 * import { detectProfiles, decode } from '@owf/eudi-jades'
 *
 * const { header, unprotectedHeader } = decode(jws)
 * const profiles = detectProfiles(header, unprotectedHeader)
 * // e.g., [JAdESProfile.B_LT, JAdESProfile.B_T, JAdESProfile.B_B]
 * ```
 */
export function detectProfiles(
  header: ProtectedHeaderParams,
  unprotectedHeader?: UnprotectedHeaderParams
): JAdESProfile[] {
  const profiles: JAdESProfile[] = []

  // Check from highest to lowest profile
  if (validateBLTA(header, unprotectedHeader).valid) {
    profiles.push(JAdESProfile.B_LTA)
  }
  if (validateBLT(header, unprotectedHeader).valid) {
    profiles.push(JAdESProfile.B_LT)
  }
  if (validateBT(header, unprotectedHeader).valid) {
    profiles.push(JAdESProfile.B_T)
  }
  if (validateBB(header).valid) {
    profiles.push(JAdESProfile.B_B)
  }

  return profiles
}
