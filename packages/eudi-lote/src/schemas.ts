/**
 * LoTE Zod Schemas
 *
 * Zod schemas for ETSI TS 119 602 (LoTE - List of Trusted Entities) format.
 * Types are derived from these schemas via z.infer<>.
 *
 * @see https://www.etsi.org/deliver/etsi_ts/119600_119699/119602/01.01.01_60/ts_119602v010101p.pdf
 */

import { z } from 'zod'

// ============================================================================
// Localized Value Schemas
// ============================================================================

export const LocalizedStringSchema = z.object({
  lang: z.string().min(1),
  value: z.string().min(1),
})

export const LocalizedURISchema = z.object({
  lang: z.string().min(1),
  uriValue: z.url(),
})

// ============================================================================
// Address Schemas
// ============================================================================

export const PostalAddressSchema = z.object({
  lang: z.string().min(1),
  StreetAddress: z.string(),
  Locality: z.string(),
  StateOrProvince: z.string().optional(),
  PostalCode: z.string(),
  Country: z.string().length(2),
})

export const SchemeOperatorAddressSchema = z.object({
  SchemeOperatorPostalAddress: z.array(PostalAddressSchema),
  SchemeOperatorElectronicAddress: z.array(LocalizedURISchema),
})

export const TrustedEntityAddressSchema = z.object({
  TEPostalAddress: z.array(PostalAddressSchema),
  TEElectronicAddress: z.array(LocalizedURISchema),
})

// ============================================================================
// Digital Identity Schemas
// ============================================================================

export const PkiObjectSchema = z.object({
  encoding: z.string().optional(),
  specRef: z.string().optional(),
  val: z.string().min(1),
})

export const X509CertificateRefSchema = PkiObjectSchema.extend({
  encoding: z.literal('urn:ietf:params:tls-cert-type:x509').optional(),
  specRef: z.literal('RFC5280').optional(),
})

export const JWKPublicKeySchema = z.looseObject({
  kty: z.enum(['RSA', 'EC', 'OKP']),
  kid: z.string().optional(),
  use: z.enum(['sig', 'enc']).optional(),
  alg: z.string().optional(),
})

export const ServiceDigitalIdentitySchema = z
  .object({
    X509Certificates: z.array(X509CertificateRefSchema).optional(),
    X509SubjectNames: z.array(z.string()).optional(),
    PublicKeyValues: z.array(JWKPublicKeySchema).optional(),
    X509SKIs: z.array(z.string()).optional(),
    OtherIds: z.array(z.string()).optional(),
  })
  .refine(
    (id) =>
      (id.X509Certificates && id.X509Certificates.length > 0) ||
      (id.X509SubjectNames && id.X509SubjectNames.length > 0) ||
      (id.PublicKeyValues && id.PublicKeyValues.length > 0) ||
      (id.X509SKIs && id.X509SKIs.length > 0) ||
      (id.OtherIds && id.OtherIds.length > 0),
    { message: 'At least one digital identity type must be provided' }
  )

// ============================================================================
// Service Schemas
// ============================================================================

export const ServiceSupplyPointSchema = z.object({
  ServiceType: z.string(),
  uriValue: z.url(),
})

export const ServiceInformationSchema = z.object({
  ServiceName: z.array(LocalizedStringSchema).min(1),
  ServiceDigitalIdentity: ServiceDigitalIdentitySchema,
  ServiceTypeIdentifier: z.url().optional(),
  ServiceStatus: z.url().optional(),
  StatusStartingTime: z.iso.datetime().optional(),
  SchemeServiceDefinitionURI: z.array(LocalizedURISchema).optional(),
  ServiceSupplyPoints: z.array(ServiceSupplyPointSchema).optional(),
  ServiceDefinitionURI: z.array(LocalizedURISchema).optional(),
  ServiceInformationExtensions: z.array(z.unknown()).optional(),
})

export const ServiceHistoryInstanceSchema = z.object({
  ServiceName: z.array(LocalizedStringSchema).min(1),
  ServiceDigitalIdentity: ServiceDigitalIdentitySchema,
  ServiceStatus: z.url(),
  StatusStartingTime: z.iso.datetime(),
  ServiceTypeIdentifier: z.url().optional(),
  ServiceInformationExtensions: z.array(z.unknown()).optional(),
})

export const TrustedEntityServiceSchema = z.object({
  ServiceInformation: ServiceInformationSchema,
  ServiceHistory: z.array(ServiceHistoryInstanceSchema).optional(),
})

// ============================================================================
// Trusted Entity Schemas
// ============================================================================

export const TrustedEntityInformationSchema = z.object({
  TEName: z.array(LocalizedStringSchema).min(1),
  TETradeName: z.array(LocalizedStringSchema).optional(),
  TEAddress: TrustedEntityAddressSchema,
  TEInformationURI: z.array(LocalizedURISchema).optional(),
  TEInformationExtensions: z.array(z.unknown()).optional(),
})

export const TrustedEntitySchema = z.object({
  TrustedEntityInformation: TrustedEntityInformationSchema,
  TrustedEntityServices: z.array(TrustedEntityServiceSchema).min(1),
})

// ============================================================================
// List and Scheme Information Schemas
// ============================================================================

export const PolicyOrLegalNoticeSchema = z.object({
  LoTEPolicy: LocalizedURISchema.optional(),
  LoTELegalNotice: LocalizedStringSchema.optional(),
})

export const LoTEQualifierSchema = z.object({
  LoTEType: z.url(),
  SchemeOperatorName: z.array(LocalizedStringSchema).min(1),
  SchemeTypeCommunityRules: z.array(LocalizedURISchema).optional(),
  SchemeTerritory: z.string().length(2).optional(),
  MimeType: z.string().min(1),
})

export const OtherLoTEPointerSchema = z.object({
  LoTELocation: z.url(),
  ServiceDigitalIdentities: z.array(ServiceDigitalIdentitySchema).min(1),
  LoTEQualifiers: z.array(LoTEQualifierSchema).min(1),
})

export const ListAndSchemeInformationSchema = z.object({
  LoTEVersionIdentifier: z.number().int(),
  LoTESequenceNumber: z.number().int(),
  LoTEType: z.url().optional(),
  SchemeOperatorName: z.array(LocalizedStringSchema).min(1),
  SchemeOperatorAddress: SchemeOperatorAddressSchema.optional(),
  SchemeName: z.array(LocalizedStringSchema).optional(),
  SchemeInformationURI: z.array(LocalizedURISchema).optional(),
  StatusDeterminationApproach: z.url().optional(),
  SchemeTypeCommunityRules: z.array(LocalizedURISchema).optional(),
  SchemeTerritory: z.string().length(2).optional(),
  PolicyOrLegalNotice: z.array(PolicyOrLegalNoticeSchema).optional(),
  HistoricalInformationPeriod: z.number().optional(),
  PointersToOtherLoTE: z.array(OtherLoTEPointerSchema).optional(),
  ListIssueDateTime: z.iso.datetime(),
  NextUpdate: z.iso.datetime(),
  DistributionPoints: z.array(z.url()).optional(),
  SchemeExtensions: z.array(z.unknown()).optional(),
})

// ============================================================================
// LoTE Root Schemas
// ============================================================================

export const LoTESchema = z.object({
  ListAndSchemeInformation: ListAndSchemeInformationSchema,
  TrustedEntitiesList: z.array(TrustedEntitySchema),
})

export const LoTEDocumentSchema = z.object({
  LoTE: LoTESchema,
})
