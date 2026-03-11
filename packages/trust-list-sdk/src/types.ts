import type { Signer } from '@owf/crypto'

/**
 * Trust List SDK Types
 *
 * Based on ETSI TS 119 602 (LoTE - List of Trusted Entities) format
 * @see https://www.etsi.org/deliver/etsi_ts/119600_119699/119602/01.01.01_60/ts_119602v010101p.pdf
 */

// ============================================================================
// Localized Value Types
// ============================================================================

/**
 * Localized string value
 */
export interface LocalizedString {
  /** ISO 639-1 language code */
  lang: string
  /** The value in the specified language */
  value: string
}

/**
 * Localized URI value
 */
export interface LocalizedURI {
  /** ISO 639-1 language code */
  lang: string
  /** The URI value */
  uriValue: string
}

// ============================================================================
// Address Types
// ============================================================================

/**
 * Postal address
 */
export interface PostalAddress {
  /** ISO 639-1 language code */
  lang: string
  /** Street address */
  StreetAddress: string
  /** City or locality */
  Locality: string
  /** State or province (optional) */
  StateOrProvince?: string
  /** Postal/ZIP code */
  PostalCode: string
  /** ISO 3166-1 alpha-2 country code */
  Country: string
}

export interface SchemeOperatorAddress {
  SchemeOperatorPostalAddress: PostalAddress[]
  SchemeOperatorElectronicAddress: LocalizedURI[]
}

export interface TrustedEntityAddress {
  TEPostalAddress: PostalAddress[]
  TEElectronicAddress: LocalizedURI[]
}

// ============================================================================
// Digital Identity Types
// ============================================================================

/**
 * PKI Object - generic container for PKI-related data
 */
export interface PkiObject {
  /** Encoding URI (e.g., 'urn:ietf:params:tls-cert-type:x509') */
  encoding?: string
  /** Specification reference (e.g., 'RFC5280') */
  specRef?: string
  /** Base64-encoded value */
  val: string
}

/**
 * X.509 Certificate reference
 */
export interface X509CertificateRef extends PkiObject {
  /** Certificate encoding URN */
  encoding?: 'urn:ietf:params:tls-cert-type:x509'
  /** Specification reference */
  specRef?: 'RFC5280'
}

/**
 * JWK Public Key
 */
export interface JWKPublicKey {
  /** Key type */
  kty: 'RSA' | 'EC' | 'OKP'
  /** Key ID */
  kid?: string
  /** Key use */
  use?: 'sig' | 'enc'
  /** Algorithm */
  alg?: string
  /** Additional JWK parameters */
  [key: string]: unknown
}

/**
 * Digital identity of a service
 */
export interface ServiceDigitalIdentity {
  /** X.509 certificates */
  X509Certificates?: X509CertificateRef[]
  /** X.509 subject names (DN format) */
  X509SubjectNames?: string[]
  /** Public key values (JWK format) */
  PublicKeyValues?: JWKPublicKey[]
  /** X.509 Subject Key Identifiers (base64-encoded) */
  X509SKIs?: string[]
  /** Other identifier strings */
  OtherIds?: string[]
}

// ============================================================================
// Service Types
// ============================================================================

/**
 * Service supply point
 */
export interface ServiceSupplyPoint {
  /** Service type URI */
  ServiceType: string
  /** Service endpoint URI */
  uriValue: string
}

/**
 * Service information extensions (custom/additional data)
 */
export type ServiceInformationExtensions = unknown[]

/**
 * Service information
 */
export interface ServiceInformation {
  /** Service name in multiple languages */
  ServiceName: LocalizedString[]
  /** Digital identity (certificates/keys) */
  ServiceDigitalIdentity: ServiceDigitalIdentity
  /** Service type identifier URI */
  ServiceTypeIdentifier?: string
  /** Current service status URI */
  ServiceStatus?: string
  /** When the current status started */
  StatusStartingTime?: string
  /** Service definition URIs */
  SchemeServiceDefinitionURI?: LocalizedURI[]
  /** Service endpoints */
  ServiceSupplyPoints?: ServiceSupplyPoint[]
  /** Additional service definition URIs */
  ServiceDefinitionURI?: LocalizedURI[]
  /** Custom extensions */
  ServiceInformationExtensions?: ServiceInformationExtensions
}

/**
 * Historical service information instance
 */
export interface ServiceHistoryInstance {
  /** Service name in multiple languages */
  ServiceName: LocalizedString[]
  /** Digital identity (certificates/keys) */
  ServiceDigitalIdentity: ServiceDigitalIdentity
  /** Service status URI at this point in history */
  ServiceStatus: string
  /** When this status started */
  StatusStartingTime: string
  /** Service type identifier URI */
  ServiceTypeIdentifier?: string
  /** Custom extensions */
  ServiceInformationExtensions?: ServiceInformationExtensions
}

/**
 * Service history - array of historical service states
 */
export type ServiceHistory = ServiceHistoryInstance[]

/**
 * A trusted entity's service
 */
export interface TrustedEntityService {
  /** Service information */
  ServiceInformation: ServiceInformation
  /** Historical service information */
  ServiceHistory?: ServiceHistory
}

// ============================================================================
// Trusted Entity Types
// ============================================================================

/**
 * Trusted Entity information extensions (custom/additional data)
 */
export type TEInformationExtensions = unknown[]

/**
 * Information about a trusted entity
 */
export interface TrustedEntityInformation {
  /** Entity name in multiple languages */
  TEName: LocalizedString[]
  /** Trade name (optional) */
  TETradeName?: LocalizedString[]
  /** Entity address */
  TEAddress: TrustedEntityAddress
  /** Information URIs */
  TEInformationURI?: LocalizedURI[]
  /** Custom extensions */
  TEInformationExtensions?: TEInformationExtensions
}

/**
 * A trusted entity in the list
 */
export interface TrustedEntity {
  /** Entity information */
  TrustedEntityInformation: TrustedEntityInformation
  /** Services provided by this entity */
  TrustedEntityServices: TrustedEntityService[]
}

// ============================================================================
// List and Scheme Information
// ============================================================================

/**
 * Policy or legal notice
 */
export interface PolicyOrLegalNotice {
  LoTEPolicy?: LocalizedURI
  LoTELegalNotice?: LocalizedString
}

/**
 * LoTE Qualifier - qualifies a pointer to another LoTE
 */
export interface LoTEQualifier {
  /** Type of the referenced LoTE */
  LoTEType: string
  /** Operator name of the referenced list */
  SchemeOperatorName: LocalizedString[]
  /** Community rules URIs */
  SchemeTypeCommunityRules?: LocalizedURI[]
  /** Territory (country code) */
  SchemeTerritory?: string
  /** MIME type of the referenced LoTE */
  MimeType: string
}

/**
 * Pointer to another LoTE list
 */
export interface OtherLoTEPointer {
  /** Location URI of the referenced LoTE */
  LoTELocation: string
  /** Digital identities for verifying the referenced LoTE */
  ServiceDigitalIdentities: ServiceDigitalIdentity[]
  /** Qualifiers describing the referenced LoTE */
  LoTEQualifiers: LoTEQualifier[]
}

/**
 * Collection of pointers to other LoTE lists
 */
export type PointersToOtherLoTE = OtherLoTEPointer[]

/**
 * Scheme extensions (custom/additional data)
 */
export type SchemeExtensions = unknown[]

/**
 * List and scheme information (header)
 */
export interface ListAndSchemeInformation {
  /** Version of the LoTE format */
  LoTEVersionIdentifier: number
  /** Sequence number (incremented on each update) */
  LoTESequenceNumber: number
  /** Type of trust list */
  LoTEType?: string
  /** Scheme operator name */
  SchemeOperatorName: LocalizedString[]
  /** Scheme operator address */
  SchemeOperatorAddress?: SchemeOperatorAddress
  /** Scheme name */
  SchemeName?: LocalizedString[]
  /** Scheme information URIs */
  SchemeInformationURI?: LocalizedURI[]
  /** How status is determined */
  StatusDeterminationApproach?: string
  /** Community rules URIs */
  SchemeTypeCommunityRules?: LocalizedURI[]
  /** Territory (country code) */
  SchemeTerritory?: string
  /** Policy or legal notices */
  PolicyOrLegalNotice?: PolicyOrLegalNotice[]
  /** How long historical information is kept (days) */
  HistoricalInformationPeriod?: number
  /** Pointers to other LoTE lists */
  PointersToOtherLoTE?: PointersToOtherLoTE
  /** When this list was issued */
  ListIssueDateTime: string
  /** When the next update is expected */
  NextUpdate: string
  /** Distribution point URIs */
  DistributionPoints?: string[]
  /** Custom scheme extensions */
  SchemeExtensions?: SchemeExtensions
}

// ============================================================================
// Trust List (LoTE) Root Type
// ============================================================================

/**
 * List of Trusted Entities (LoTE) - main structure
 */
export interface LoTE {
  /** List and scheme information (header) */
  ListAndSchemeInformation: ListAndSchemeInformation
  /** List of trusted entities */
  TrustedEntitiesList: TrustedEntity[]
}

/**
 * Trust List wrapper
 */
export interface TrustList {
  LoTE: LoTE
}

// ============================================================================
// Signed Trust List Types
// ============================================================================

/**
 * Signed trust list (JWS format)
 */
export interface SignedTrustList {
  /** The compact JWS string */
  jws: string
  /** Decoded header */
  header: {
    alg: string
    typ: string
    kid?: string
    x5c?: string[]
  }
  /** Decoded payload */
  payload: TrustList
}

/**
 * Options for signing a trust list
 */
export interface SignOptions {
  /** The trust list to sign */
  trustList: TrustList
  /** Key ID for the signing key */
  keyId: string
  /** Algorithm (default: ES256) */
  algorithm?: 'ES256' | 'ES384' | 'ES512' | 'RS256' | 'RS384' | 'RS512'
  /** PEM-encoded certificates for x5c header (each element is a single PEM certificate) */
  certificates?: string[]
  /** Signer function for signing the JWS */
  signer: Signer
}

/**
 * Options for publishing a trust list
 */
export interface PublishOptions {
  /** The signed trust list JWS */
  jws: string
  /** The registrar API base URL */
  registrarUrl: string
  /** Optional: Bearer token for authentication */
  authToken?: string
}

/**
 * Result from publishing a trust list
 */
export interface PublishResult {
  /** Whether the publish was successful */
  success: boolean
  /** The assigned trust list ID (if successful) */
  id?: string
  /** Error message (if failed) */
  error?: string
}

/**
 * Result from verifying a trust list
 */
export interface VerificationResult {
  /** Whether the signature is valid */
  valid: boolean
  /** The decoded payload (if valid) */
  payload?: TrustList
  /** The signing key ID */
  keyId?: string
  /** Certificate chain (if present) */
  certificates?: string[]
  /** Error message (if invalid) */
  error?: string
}
