/**
 * JAdES Token
 *
 * Main class for creating JAdES-compliant signatures.
 * Implements ETSI TS 119 182-1 standard for JSON Advanced Electronic Signatures.
 *
 * @example
 * ```typescript
 * import { Token, parseCerts, generateX5c } from '@owf/eudi-jades'
 * import { ES256 } from '@owf/crypto'
 *
 * const payload = { hello: 'world' }
 * const token = new Token(payload)
 *
 * const certs = parseCerts(pemCertificate)
 * token.setProtectedHeader({
 *   alg: 'ES256',
 *   x5c: generateX5c(certs),
 * })
 *
 * const signer = await ES256.getSigner(privateKey)
 * await token.sign(signer)
 *
 * const compactJws = token.toString()
 * const generalJws = token.toJSON()
 * ```
 */

import { base64urlEncode } from '@owf/identity-common'
import { CRITICAL_PARAMETERS, DETACHED_MECHANISM_IDS } from './constants'
import { JAdESException } from './jades-exception'
import { ProtectedHeaderForSigningSchema, ProtectedHeaderSchema, SignAlgSchema } from './schemas'
import type { GeneralJWS, ProtectedHeaderParams, SigD, UnprotectedHeaderParams, X5tO } from './types'
import { encodeJSON } from './utils'

/**
 * JAdES Token class for creating conformant JAdES signatures.
 */
export class Token<T extends Record<string, unknown> = Record<string, unknown>> {
  private protectedHeader: ProtectedHeaderParams = {}
  private unprotectedHeader: UnprotectedHeaderParams = {}
  private readonly payload: T | undefined
  private encodedPayload: string
  private signature: string | undefined

  /**
   * Create a new JAdES Token.
   *
   * @param payload - The payload to sign. If undefined, creates a detached signature.
   */
  constructor(payload?: T) {
    this.payload = payload
    this.encodedPayload = payload === undefined ? '' : base64urlEncode(JSON.stringify(payload))
  }

  /**
   * Set the protected header parameters.
   *
   * @param header - Protected header parameters
   * @returns this for method chaining
   */
  setProtectedHeader(header: ProtectedHeaderParams): this {
    // Validate algorithm if provided
    if (header.alg) {
      const algResult = SignAlgSchema.safeParse(header.alg)
      if (!algResult.success) {
        throw new JAdESException(`Invalid algorithm: ${header.alg}`)
      }
    }

    // Validate header structure
    const result = ProtectedHeaderSchema.safeParse(header)
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message).join(', ')
      throw new JAdESException(`Invalid protected header: ${errors}`)
    }

    this.protectedHeader = { ...this.protectedHeader, ...header }
    return this
  }

  /**
   * Set the unprotected header parameters.
   *
   * @param header - Unprotected header parameters
   * @returns this for method chaining
   */
  setUnprotectedHeader(header: UnprotectedHeaderParams): this {
    this.unprotectedHeader = { ...this.unprotectedHeader, ...header }
    return this
  }

  /**
   * Set X.509 certificate chain (x5c header).
   *
   * ETSI TS 119 182-1 Section 5.1.8
   *
   * @param certs - Array of base64-encoded DER certificates
   * @returns this for method chaining
   */
  setX5c(certs: string[]): this {
    this.protectedHeader.x5c = certs
    return this
  }

  /**
   * Set X.509 certificate URL (x5u header).
   *
   * ETSI TS 119 182-1 Section 5.1.5
   *
   * @param uri - URI to certificate resource
   * @returns this for method chaining
   */
  setX5u(uri: string): this {
    this.protectedHeader.x5u = uri
    return this
  }

  /**
   * Set X.509 certificate SHA-256 thumbprint (x5t#S256 header).
   *
   * ETSI TS 119 182-1 Section 5.1.7
   *
   * @param thumbprint - Base64url-encoded SHA-256 thumbprint
   * @returns this for method chaining
   */
  setX5tS256(thumbprint: string): this {
    this.protectedHeader['x5t#S256'] = thumbprint
    return this
  }

  /**
   * Set X.509 certificate thumbprint with other algorithm (x5t#o header).
   *
   * ETSI TS 119 182-1 Section 5.2.2.2
   *
   * @param x5tO - X5tO object with algorithm and digest value
   * @returns this for method chaining
   */
  setX5tO(x5tO: X5tO): this {
    this.protectedHeader['x5t#o'] = x5tO
    return this
  }

  /**
   * Set signing time (sigT header).
   *
   * ETSI TS 119 182-1 Section 5.2.1
   *
   * @param time - ISO 8601 timestamp (defaults to current time)
   * @returns this for method chaining
   */
  setSigningTime(time?: string): this {
    this.protectedHeader.sigT = time ?? new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    return this
  }

  /**
   * Set signedAt timestamp in protected header.
   *
   * @param sec - Unix timestamp in seconds (defaults to current time)
   * @returns this for method chaining
   */
  setSignedAt(sec?: number): this {
    this.protectedHeader.signedAt = sec ?? Math.floor(Date.now() / 1000)
    return this
  }

  /**
   * Set issued at timestamp (iat) in protected header.
   *
   * @param sec - Unix timestamp in seconds (defaults to current time)
   * @returns this for method chaining
   */
  setIssuedAt(sec?: number): this {
    this.protectedHeader.iat = sec ?? Math.floor(Date.now() / 1000)
    return this
  }

  /**
   * Set key ID (kid header).
   *
   * @param kid - Key identifier
   * @returns this for method chaining
   */
  setKid(kid: string): this {
    this.protectedHeader.kid = kid
    return this
  }

  /**
   * Set content type (cty header).
   *
   * @param cty - Content type
   * @returns this for method chaining
   */
  setContentType(cty: string): this {
    this.protectedHeader.cty = cty
    return this
  }

  /**
   * Set token type (typ header).
   *
   * @param typ - Token type
   * @returns this for method chaining
   */
  setType(typ: string): this {
    this.protectedHeader.typ = typ
    return this
  }

  /**
   * Set b64 header parameter.
   *
   * ETSI TS 119 182-1 Section 5.1.10
   * RFC 7797 Section 3
   *
   * @param b64 - If true (default), payload is base64url encoded. If false, payload is unencoded.
   * @returns this for method chaining
   */
  setB64(b64: boolean): this {
    if (b64) {
      delete this.protectedHeader.b64
    } else {
      this.protectedHeader.b64 = false
    }
    return this
  }

  /**
   * Configure detached signature mode.
   *
   * ETSI TS 119 182-1 Section 5.2.8
   *
   * @param sigD - Detached signature descriptor
   * @returns this for method chaining
   */
  setDetached(sigD: SigD): this {
    this.protectedHeader.sigD = sigD
    this.encodedPayload = ''

    // If using HttpHeaders mechanism, b64 must be false
    if (sigD.mId === DETACHED_MECHANISM_IDS.httpHeaders) {
      this.setB64(false)
    }

    return this
  }

  /**
   * Get the signing input (data to be signed).
   *
   * @returns The signing input string (header.payload)
   */
  getSigningInput(): string {
    const encodedHeader = this.getEncodedProtectedHeader()
    return `${encodedHeader}.${this.encodedPayload}`
  }

  /**
   * Get the hash of the signing input for external signing.
   *
   * @param algorithm - Hash algorithm (defaults to algorithm from header)
   * @returns Promise resolving to hash bytes
   */
  async getHash(algorithm?: string): Promise<Uint8Array> {
    const alg = algorithm ?? this.getHashAlgorithm()
    const signingInput = this.getSigningInput()
    const encoder = new TextEncoder()
    const hashBuffer = await globalThis.crypto.subtle.digest(alg, encoder.encode(signingInput))
    return new Uint8Array(hashBuffer)
  }

  /**
   * Set the signature (for external signing).
   *
   * @param signature - Base64url-encoded signature
   * @returns this for method chaining
   */
  setSignature(signature: string): this {
    this.signature = signature
    return this
  }

  /**
   * Sign the token using the provided signer function.
   *
   * @param signer - Async function that signs data and returns base64url signature
   * @returns Promise resolving to this for method chaining
   */
  async sign(signer: (data: string) => Promise<string>): Promise<this> {
    this.validateBeforeSign()
    const signingInput = this.getSigningInput()
    this.signature = await signer(signingInput)
    return this
  }

  /**
   * Export to compact JWS serialization.
   *
   * @returns Compact JWS string (header.payload.signature)
   */
  toString(): string {
    if (!this.signature) {
      throw new JAdESException('Token not signed yet')
    }
    return `${this.getEncodedProtectedHeader()}.${this.encodedPayload}.${this.signature}`
  }

  /**
   * Export to General JWS JSON serialization.
   *
   * @returns GeneralJWS object
   */
  toJSON(): GeneralJWS {
    if (!this.signature) {
      throw new JAdESException('Token not signed yet')
    }

    const result: GeneralJWS = {
      payload: this.encodedPayload,
      signatures: [
        {
          protected: this.getEncodedProtectedHeader(),
          signature: this.signature,
        },
      ],
    }

    // Add unprotected header if present
    if (Object.keys(this.unprotectedHeader).length > 0) {
      result.signatures[0].header = this.unprotectedHeader
    }

    return result
  }

  /**
   * Export to flattened JWS JSON serialization.
   *
   * @returns Flattened JWS object
   */
  toFlattenedJSON(): {
    protected: string
    payload: string
    signature: string
    header?: UnprotectedHeaderParams
  } {
    if (!this.signature) {
      throw new JAdESException('Token not signed yet')
    }

    const result: {
      protected: string
      payload: string
      signature: string
      header?: UnprotectedHeaderParams
    } = {
      protected: this.getEncodedProtectedHeader(),
      payload: this.encodedPayload,
      signature: this.signature,
    }

    if (Object.keys(this.unprotectedHeader).length > 0) {
      result.header = this.unprotectedHeader
    }

    return result
  }

  /**
   * Get the protected header object.
   */
  getProtectedHeader(): ProtectedHeaderParams {
    return { ...this.protectedHeader }
  }

  /**
   * Get the unprotected header object.
   */
  getUnprotectedHeader(): UnprotectedHeaderParams {
    return { ...this.unprotectedHeader }
  }

  /**
   * Get the payload.
   */
  getPayload(): T | undefined {
    return this.payload
  }

  // Private methods

  private getEncodedProtectedHeader(): string {
    const header = this.buildFinalHeader()
    return encodeJSON(header)
  }

  private buildFinalHeader(): ProtectedHeaderParams {
    const header = { ...this.protectedHeader }

    // Add critical parameters
    const critParams = CRITICAL_PARAMETERS.filter((param) => param in header)
    if (critParams.length > 0) {
      header.crit = critParams
    }

    return header
  }

  private validateBeforeSign(): void {
    // Validate complete header for signing (alg required + certificate headers)
    const result = ProtectedHeaderForSigningSchema.safeParse(this.protectedHeader)
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message).join(', ')
      throw new JAdESException(`Invalid protected header for signing: ${errors}`)
    }
  }

  private getHashAlgorithm(): string {
    const algMap: Record<string, string> = {
      RS256: 'SHA-256',
      RS384: 'SHA-384',
      RS512: 'SHA-512',
      PS256: 'SHA-256',
      PS384: 'SHA-384',
      PS512: 'SHA-512',
      ES256: 'SHA-256',
      ES384: 'SHA-384',
      ES512: 'SHA-512',
    }

    const alg = this.protectedHeader.alg
    if (!alg || !algMap[alg as string]) {
      throw new JAdESException(`Unsupported algorithm: ${alg as string}`)
    }

    return algMap[alg as string]
  }
}
