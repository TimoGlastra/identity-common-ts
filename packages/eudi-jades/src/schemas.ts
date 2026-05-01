/**
 * JAdES Zod Schemas
 *
 * Zod schemas for JAdES (JSON Advanced Electronic Signatures) as per ETSI TS 119 182-1.
 * Types are derived from these schemas via z.infer<>.
 *
 * @see https://www.etsi.org/deliver/etsi_ts/119100_119199/11918201/01.02.01_60/ts_11918201v010201p.pdf
 */

import { z } from 'zod'

// ============================================================================
// Algorithm Schema
// ============================================================================

/**
 * Supported signature algorithms.
 */
export const SignAlgSchema = z.enum(['ES256', 'ES384', 'ES512', 'RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512'])

// ============================================================================
// X.509 Certificate Schemas
// ============================================================================

/**
 * X.509 Certificate Thumbprint with algorithm specification.
 * ETSI TS 119 182-1 Section 5.2.2.2
 */
export const X5tOSchema = z.object({
  /** Digest algorithm identifier (e.g., 'S384', 'S512') */
  digAlg: z.string().min(1),
  /** Base64url-encoded digest value */
  digVal: z.string().min(1),
})

// ============================================================================
// Commitment Reference Schema
// ============================================================================

/**
 * Commitment reference as per ETSI TS 119 182-1 Section 5.2.5.
 */
export const CommitmentReferenceSchema = z.object({
  /** Commitment type identifier (OID or URI) */
  commId: z.string().min(1),
  /** Commitment qualifiers */
  commQuals: z.array(z.object({}).passthrough()).optional(),
})

// ============================================================================
// Signature Policy Schema
// ============================================================================

/**
 * Signature policy hash.
 */
export const SignaturePolicyHashSchema = z.object({
  hashAlgo: z.string().min(1),
  hashVal: z.string().min(1),
})

/**
 * Signature policy descriptor.
 * ETSI TS 119 182-1 Section 5.2.4
 */
export const SignaturePolicySchema = z.object({
  /** Policy identifier */
  sigPolicyId: z.string().optional(),
  /** Policy hash */
  sigPolicyHash: SignaturePolicyHashSchema.optional(),
  /** Policy qualifiers */
  sigPolicyQualifiers: z.array(z.object({}).passthrough()).optional(),
})

// ============================================================================
// Signer Identifier Schema
// ============================================================================

/**
 * Issuer and serial number for signer identification.
 */
export const IssuerSerialSchema = z.object({
  issuer: z.string().min(1),
  serialNumber: z.string().min(1),
})

/**
 * Signer identifier.
 * ETSI TS 119 182-1 Section 5.2.3
 */
export const SignerIdentifierSchema = z.object({
  /** Issuer and serial number */
  issuerSerial: IssuerSerialSchema.optional(),
  /** Subject key identifier */
  subjectKeyIdentifier: z.string().optional(),
})

// ============================================================================
// Detached Signature Descriptor Schema
// ============================================================================

/**
 * Detached signature descriptor.
 * ETSI TS 119 182-1 Section 5.2.8
 */
export const SigDSchema = z.object({
  /** Mechanism identifier */
  mId: z.string().min(1),
  /** Parameters (tuple of 2 strings) */
  pars: z.tuple([z.string(), z.string()]),
  /** Hash algorithm */
  hashM: z.string().optional(),
  /** Canonicalization algorithm */
  ctM: z.string().optional(),
})

// ============================================================================
// Timestamp Schemas (for B-T, B-LT, B-LTA profiles)
// ============================================================================

/**
 * Timestamp token value.
 */
export const TstTokenValueSchema = z.object({
  val: z.string().min(1),
})

/**
 * Timestamp tokens container.
 */
export const TstTokensSchema = z.object({
  tstTokens: z.array(TstTokenValueSchema).min(1),
})

/**
 * Signature timestamp container (for B-T profile).
 */
export const SigTstSchema = z.object({
  sigTst: TstTokensSchema,
})

/**
 * X.509 certificate values (for B-LT profile).
 */
export const XValsSchema = z.object({
  xVals: z.array(
    z.object({
      x509Cert: z.string().min(1),
    })
  ),
})

/**
 * Revocation values (for B-LT profile).
 */
export const RValsSchema = z.object({
  rVals: z.object({
    crlVals: z.array(z.string()),
    ocspVals: z.array(z.string()),
  }),
})

/**
 * Archive timestamp (for B-LTA profile).
 */
export const ArcTstSchema = z.object({
  arcTst: TstTokensSchema.extend({
    canonAlg: z.string().optional(),
  }),
})

/**
 * ETSI Unsigned properties for different JAdES profiles.
 */
export const EtsiUSchema = z.union([
  // B-T: Just timestamp
  z.array(SigTstSchema),
  // B-LT: timestamp + validation data
  z.tuple([SigTstSchema, XValsSchema, RValsSchema]),
  // B-LTA: timestamp + validation data + archive timestamp
  z.tuple([SigTstSchema, XValsSchema, RValsSchema, ArcTstSchema]),
])

// ============================================================================
// Protected Header Schema
// ============================================================================

/**
 * JAdES Protected Header parameters as per ETSI TS 119 182-1.
 */
export const ProtectedHeaderSchema = z
  .object({
    /** Signature algorithm (required for signing) */
    alg: SignAlgSchema.optional(),

    /** Content type */
    cty: z.string().optional(),

    /** Key ID - ETSI TS 119 182-1 Section 5.1.4 */
    kid: z.string().optional(),

    /** X.509 URL - ETSI TS 119 182-1 Section 5.1.5 */
    x5u: z.string().url().optional(),

    /** X.509 Certificate Chain - ETSI TS 119 182-1 Section 5.1.8 */
    x5c: z.array(z.string().min(1)).min(1).optional(),

    /** X.509 Certificate SHA-256 Thumbprint - ETSI TS 119 182-1 Section 5.1.7 */
    'x5t#S256': z.string().min(1).optional(),

    /** X.509 Certificate Thumbprint with Other Algorithm - ETSI TS 119 182-1 Section 5.2.2.2 */
    'x5t#o': X5tOSchema.optional(),

    /** X.509 Certificate Thumbprints for Chain - ETSI TS 119 182-1 Section 5.2.2.3 */
    sigX5ts: z.array(X5tOSchema).min(2).optional(),

    /** Signer's commitment reference - ETSI TS 119 182-1 Section 5.2.5 */
    srCms: z.array(CommitmentReferenceSchema).optional(),

    /** Signer's attributes reference */
    srAts: z.array(z.object({}).passthrough()).optional(),

    /** Signature policy - ETSI TS 119 182-1 Section 5.2.4 */
    sigPl: SignaturePolicySchema.optional(),

    /** Signer identifier */
    sigPId: SignerIdentifierSchema.optional(),

    /** Signing time - ETSI TS 119 182-1 Section 5.2.1 (ISO 8601) */
    sigT: z.string().optional(),

    /** Detached signature descriptor - ETSI TS 119 182-1 Section 5.2.8 */
    sigD: SigDSchema.optional(),

    /** Base64url encoding flag - RFC 7797 Section 3 */
    b64: z.literal(false).optional(),

    /** Critical headers */
    crit: z.array(z.string()).optional(),

    /** Issued at timestamp (Unix seconds) */
    iat: z.number().int().positive().optional(),

    /** Signed at timestamp (Unix seconds) */
    signedAt: z.number().int().positive().optional(),

    /** JWT ID */
    jti: z.string().optional(),

    /** Token type */
    typ: z.string().optional(),

    /** ADO timestamps */
    adoTst: z.array(z.object({}).passthrough()).optional(),
  })
  .passthrough()

/**
 * Protected header schema for signing (alg required).
 */
export const ProtectedHeaderForSigningSchema = ProtectedHeaderSchema.extend({
  alg: SignAlgSchema,
}).refine(
  (header) => {
    // At least one certificate header must be present
    return !!(header['x5t#S256'] || header.x5c || header['x5t#o'] || header.sigX5ts)
  },
  {
    message: 'JAdES signature requires at least one certificate header: x5t#S256, x5c, x5t#o, or sigX5ts',
  }
)

// ============================================================================
// Unprotected Header Schema
// ============================================================================

/**
 * JAdES Unprotected Header parameters.
 */
export const UnprotectedHeaderSchema = z
  .object({
    /** ETSI unsigned properties */
    etsiU: EtsiUSchema.optional(),
    /** Disclosures (for SD-JWT) */
    disclosures: z.array(z.string()).optional(),
    /** Key ID */
    kid: z.string().optional(),
    /** Key binding JWT */
    kb_jwt: z.string().optional(),
  })
  .passthrough()

// ============================================================================
// JWS Serialization Schemas
// ============================================================================

/**
 * Signature entry in General JWS.
 */
export const JWSSignatureSchema = z.object({
  /** Base64url-encoded protected header */
  protected: z.string().min(1),
  /** Base64url-encoded signature */
  signature: z.string().min(1),
  /** Unprotected header */
  header: UnprotectedHeaderSchema.optional(),
})

/**
 * General JWS structure with multiple signatures.
 */
export const GeneralJWSSchema = z.object({
  /** Base64url-encoded payload */
  payload: z.string(),
  /** Array of signature objects */
  signatures: z.array(JWSSignatureSchema).min(1),
})

/**
 * Flattened JWS structure (single signature).
 */
export const FlattenedJWSSchema = z.object({
  /** Base64url-encoded protected header */
  protected: z.string().min(1),
  /** Base64url-encoded payload */
  payload: z.string(),
  /** Base64url-encoded signature */
  signature: z.string().min(1),
  /** Unprotected header */
  header: UnprotectedHeaderSchema.optional(),
})

/**
 * Compact JWS representation.
 */
export const CompactJWSSchema = z.object({
  /** Base64url-encoded protected header */
  protected: z.string().min(1),
  /** Base64url-encoded payload */
  payload: z.string(),
  /** Base64url-encoded signature */
  signature: z.string().min(1),
})

// ============================================================================
// Sign/Verify Options Schemas
// ============================================================================

/**
 * Sign options for JAdES signing.
 */
export const SignOptionsSchema = z.object({
  /** Signature algorithm */
  alg: SignAlgSchema,
  /** Key ID */
  kid: z.string().optional(),
  /** X.509 certificates (PEM or base64 DER) */
  certificates: z.array(z.string()).optional(),
})

/**
 * Verify options for JAdES verification.
 */
export const VerifyOptionsSchema = z.object({
  /** Whether to skip signature validation (decode only) */
  skipSignatureValidation: z.boolean().optional(),
})
