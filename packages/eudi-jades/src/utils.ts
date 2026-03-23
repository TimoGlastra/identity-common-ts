/**
 * JAdES Utility Functions
 *
 * Helper functions for certificate handling and header generation.
 */

import { parseCertificateChain } from '@owf/crypto'
import { base64urlDecode, base64urlEncode } from '@owf/identity-common'
import { JAdESException } from './jades-exception'
import type { X5tO } from './types'

/**
 * Parse PEM-encoded certificate chain and return base64 DER strings.
 *
 * @param pem - One or more PEM-encoded certificates
 * @returns Array of base64-encoded DER certificate strings
 */
export function parseCerts(pem: string): string[] {
  return parseCertificateChain(pem)
}

/**
 * Generate x5c header value from PEM certificates.
 * The certificates are converted to base64-encoded DER format.
 *
 * ETSI TS 119 182-1 Section 5.1.8
 *
 * @param certs - PEM-encoded certificate(s) or array of base64 DER certs
 * @returns Array of base64-encoded DER certificate strings
 */
export function generateX5c(certs: string | string[]): string[] {
  if (typeof certs === 'string') {
    return parseCertificateChain(certs)
  }
  return certs
}

/**
 * Generate x5t#S256 header value (SHA-256 thumbprint of certificate).
 *
 * ETSI TS 119 182-1 Section 5.1.7
 *
 * @param certDer - Base64-encoded DER certificate
 * @returns Base64url-encoded SHA-256 thumbprint
 */
export async function generateX5tS256(certDer: string): Promise<string> {
  const certBytes = base64ToUint8Array(certDer) as BufferSource
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', certBytes)
  return uint8ArrayToBase64Url(new Uint8Array(hashBuffer))
}

/**
 * Generate x5t#o header value (certificate thumbprint with specified algorithm).
 *
 * ETSI TS 119 182-1 Section 5.2.2.2
 *
 * @param certDer - Base64-encoded DER certificate
 * @param algorithm - Hash algorithm ('SHA-384' or 'SHA-512')
 * @returns X5tO object with algorithm identifier and digest value
 */
export async function generateX5tO(certDer: string, algorithm: 'SHA-384' | 'SHA-512' = 'SHA-512'): Promise<X5tO> {
  const algMap = {
    'SHA-384': 'S384',
    'SHA-512': 'S512',
  } as const

  const certBytes = base64ToUint8Array(certDer) as BufferSource
  const hashBuffer = await globalThis.crypto.subtle.digest(algorithm, certBytes)

  return {
    digAlg: algMap[algorithm],
    digVal: uint8ArrayToBase64Url(new Uint8Array(hashBuffer)),
  }
}

/**
 * Generate sigX5ts header value (certificate chain thumbprints).
 *
 * ETSI TS 119 182-1 Section 5.2.2.3
 *
 * @param certsDer - Array of base64-encoded DER certificates
 * @param algorithm - Hash algorithm ('SHA-384' or 'SHA-512')
 * @returns Array of X5tO objects
 */
export async function generateSigX5ts(
  certsDer: string[],
  algorithm: 'SHA-384' | 'SHA-512' = 'SHA-512'
): Promise<X5tO[]> {
  if (certsDer.length < 2) {
    throw new JAdESException('sigX5ts requires at least 2 certificates')
  }

  return Promise.all(certsDer.map((cert) => generateX5tO(cert, algorithm)))
}

/**
 * Generate a JAdES-compliant kid from X.509 certificate.
 *
 * According to ETSI TS 119 182-1 Section 5.1.4, the kid should be
 * the base64 encoding of DER-encoded IssuerSerial sequence.
 *
 * This implementation generates a SHA-256 thumbprint of the certificate
 * as a simpler approach that uniquely identifies the certificate.
 *
 * @param certDer - Base64-encoded DER certificate
 * @returns Base64url-encoded key identifier
 */
export async function generateKid(certDer: string): Promise<string> {
  // Use SHA-256 thumbprint as kid for simplicity
  return generateX5tS256(certDer)
}

/**
 * Encode an object as a base64url JSON string.
 *
 * @param obj - Object to encode
 * @returns Base64url-encoded JSON string
 */
export function encodeJSON(obj: object): string {
  return base64urlEncode(JSON.stringify(obj))
}

/**
 * Decode a base64url JSON string to an object.
 *
 * @param encoded - Base64url-encoded JSON string
 * @returns Decoded object
 */
export function decodeJSON<T = unknown>(encoded: string): T {
  return JSON.parse(base64urlDecode(encoded)) as T
}

/**
 * Get current ISO 8601 timestamp for sigT header.
 *
 * @returns ISO 8601 timestamp string
 */
export function getSigningTime(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/**
 * Validate that the protected header has at least one certificate header.
 * As per ETSI TS 119 182-1 Section 5.1.7, a JAdES signature shall have
 * at least one of: x5t#S256, x5c, x5t#o, sigX5ts.
 *
 * @param header - Protected header object
 * @returns true if valid
 * @throws JAdESException if no certificate header is present
 */
export function validateCertificateHeaders(header: Record<string, unknown>): boolean {
  const hasCertHeader = !!(header['x5t#S256'] || header.x5c || header['x5t#o'] || header.sigX5ts)

  if (!hasCertHeader) {
    throw new JAdESException(
      'JAdES signature requires at least one certificate header: x5t#S256, x5c, x5t#o, or sigX5ts'
    )
  }

  return true
}

// Helper functions for base64/base64url conversion

function base64ToUint8Array(base64: string): Uint8Array {
  // Handle both standard base64 and base64url
  const normalized = base64.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  const binaryString = atob(padded)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
