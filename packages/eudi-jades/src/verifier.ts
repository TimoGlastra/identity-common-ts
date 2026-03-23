/**
 * JAdES Verifier
 *
 * Functions for verifying JAdES signatures.
 */

import { base64urlDecode } from '@owf/identity-common'
import { JAdESException } from './jades-exception'
import { GeneralJWSSchema, ProtectedHeaderSchema } from './schemas'
import type { GeneralJWS, ProtectedHeaderParams, UnprotectedHeaderParams } from './types'

/**
 * Result of JAdES signature verification.
 */
export interface VerifyResult<T = unknown> {
  /** Decoded protected header */
  header: ProtectedHeaderParams
  /** Decoded payload */
  payload: T
  /** Unprotected header (if present) */
  unprotectedHeader?: UnprotectedHeaderParams
  /** Whether the signature is valid */
  valid: boolean
}

/**
 * Verify a JAdES signature in compact serialization.
 *
 * @param jws - Compact JWS string
 * @param verifier - Async function that verifies signature
 * @returns Promise resolving to verification result
 */
export async function verifyCompact<T = unknown>(
  jws: string,
  verifier: (data: string, signature: string) => Promise<boolean>
): Promise<VerifyResult<T>> {
  const parts = jws.split('.')

  if (parts.length !== 3) {
    throw new JAdESException('Invalid JWS format: expected 3 parts')
  }

  const [encodedHeader, encodedPayload, signature] = parts
  const signingInput = `${encodedHeader}.${encodedPayload}`

  const valid = await verifier(signingInput, signature)

  if (!valid) {
    throw new JAdESException('Invalid signature')
  }

  // Parse and validate header with Zod
  const rawHeader = JSON.parse(base64urlDecode(encodedHeader))
  const headerResult = ProtectedHeaderSchema.safeParse(rawHeader)
  if (!headerResult.success) {
    const errors = headerResult.error.issues.map((e) => e.message).join(', ')
    throw new JAdESException(`Invalid protected header: ${errors}`)
  }
  const header = headerResult.data as ProtectedHeaderParams

  const payload = encodedPayload ? (JSON.parse(base64urlDecode(encodedPayload)) as T) : ({} as T)

  return {
    header,
    payload,
    valid,
  }
}

/**
 * Verify a JAdES signature in General JWS JSON serialization.
 *
 * @param generalJws - General JWS object
 * @param verifier - Async function that verifies signature
 * @param signatureIndex - Index of signature to verify (default: 0)
 * @returns Promise resolving to verification result
 */
export async function verifyGeneral<T = unknown>(
  generalJws: GeneralJWS,
  verifier: (data: string, signature: string) => Promise<boolean>,
  signatureIndex = 0
): Promise<VerifyResult<T>> {
  // Validate General JWS structure with Zod
  const jwsResult = GeneralJWSSchema.safeParse(generalJws)
  if (!jwsResult.success) {
    const errors = jwsResult.error.issues.map((e) => e.message).join(', ')
    throw new JAdESException(`Invalid General JWS structure: ${errors}`)
  }

  const sig = generalJws.signatures[signatureIndex]

  if (!sig) {
    throw new JAdESException(`Signature at index ${signatureIndex} not found`)
  }

  const signingInput = `${sig.protected}.${generalJws.payload}`
  const valid = await verifier(signingInput, sig.signature)

  if (!valid) {
    throw new JAdESException('Invalid signature')
  }

  // Parse and validate header with Zod
  const rawHeader = JSON.parse(base64urlDecode(sig.protected))
  const headerResult = ProtectedHeaderSchema.safeParse(rawHeader)
  if (!headerResult.success) {
    const errors = headerResult.error.issues.map((e) => e.message).join(', ')
    throw new JAdESException(`Invalid protected header: ${errors}`)
  }
  const header = headerResult.data as ProtectedHeaderParams

  const payload = generalJws.payload ? (JSON.parse(base64urlDecode(generalJws.payload)) as T) : ({} as T)

  return {
    header,
    payload,
    unprotectedHeader: sig.header,
    valid,
  }
}

/**
 * Verify a JAdES signature (auto-detects format).
 *
 * @param jws - JWS string or GeneralJWS object
 * @param verifier - Async function that verifies signature
 * @returns Promise resolving to verification result
 */
export async function verify<T = unknown>(
  jws: string | GeneralJWS,
  verifier: (data: string, signature: string) => Promise<boolean>
): Promise<VerifyResult<T>> {
  if (typeof jws === 'string') {
    // Try to parse as JSON first (General JWS)
    try {
      const parsed = JSON.parse(jws) as GeneralJWS
      if (parsed.signatures && Array.isArray(parsed.signatures)) {
        return verifyGeneral<T>(parsed, verifier)
      }
    } catch {
      // Not JSON, treat as compact
    }
    return verifyCompact<T>(jws, verifier)
  }

  return verifyGeneral<T>(jws, verifier)
}

/**
 * Decode a JWS without verifying the signature.
 * Use this only for inspection - always verify before trusting the content.
 *
 * @param jws - JWS string or GeneralJWS object
 * @returns Decoded header and payload
 */
export function decode<T = unknown>(
  jws: string | GeneralJWS
): {
  header: ProtectedHeaderParams
  payload: T
  unprotectedHeader?: UnprotectedHeaderParams
} {
  if (typeof jws === 'string') {
    // Try JSON first
    try {
      const parsed = JSON.parse(jws) as GeneralJWS
      if (parsed.signatures && Array.isArray(parsed.signatures)) {
        const sig = parsed.signatures[0]
        return {
          header: JSON.parse(base64urlDecode(sig.protected)) as ProtectedHeaderParams,
          payload: parsed.payload ? (JSON.parse(base64urlDecode(parsed.payload)) as T) : ({} as T),
          unprotectedHeader: sig.header,
        }
      }
    } catch {
      // Compact format
    }

    const parts = jws.split('.')
    if (parts.length !== 3) {
      throw new JAdESException('Invalid JWS format')
    }

    return {
      header: JSON.parse(base64urlDecode(parts[0])) as ProtectedHeaderParams,
      payload: parts[1] ? (JSON.parse(base64urlDecode(parts[1])) as T) : ({} as T),
    }
  }

  const sig = jws.signatures[0]
  return {
    header: JSON.parse(base64urlDecode(sig.protected)) as ProtectedHeaderParams,
    payload: jws.payload ? (JSON.parse(base64urlDecode(jws.payload)) as T) : ({} as T),
    unprotectedHeader: sig.header,
  }
}
