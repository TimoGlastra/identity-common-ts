import { parseCertificate } from '@owf/crypto'
import { base64urlEncode } from '@owf/identity-common'
import type { ListAndSchemeInformation, LoTE, LoTEDocument, SignedLoTE, SignOptions, TrustedEntity } from './types'

/**
 * Sign a LoTE document
 *
 * @param options - Signing options including LoTE document, key ID, and signer function
 * @returns The signed LoTE document as a JWS
 *
 * @example Using a local key via @owf/crypto:
 * ```typescript
 * import { ES256 } from '@owf/crypto';
 * import { signLoTE } from '@owf/eudi-lote';
 *
 * const { privateKey } = await ES256.generateKeyPair();
 * const signer = await ES256.getSigner(privateKey);
 * const signed = await signLoTE({
 *   lote: myLoTE,
 *   keyId: 'lote-signer-2025',
 *   signer,
 * });
 * ```
 *
 * @example Using an external KMS:
 * ```typescript
 * const signed = await signLoTE({
 *   lote: myLoTE,
 *   keyId: 'lote-signer-2025',
 *   signer: async (data) => myKms.sign('ES256', data),
 * });
 * ```
 */
export async function signLoTE(options: SignOptions): Promise<SignedLoTE> {
  const { lote, keyId, algorithm = 'ES256', certificates, signer } = options

  const header: Record<string, unknown> = {
    alg: algorithm,
    typ: 'trustlist+jwt',
    kid: keyId,
  }

  if (certificates && certificates.length > 0) {
    header.x5c = certificates.map(parseCertificate)
  }

  const encodedHeader = base64urlEncode(JSON.stringify(header))
  const encodedPayload = base64urlEncode(JSON.stringify(lote))
  const signingInput = `${encodedHeader}.${encodedPayload}`

  const signature = await signer(signingInput)
  const jws = `${signingInput}.${signature}`

  return {
    jws,
    header: {
      alg: algorithm,
      typ: 'trustlist+jwt',
      kid: keyId,
      x5c: header.x5c as string[] | undefined,
    },
    payload: lote,
  }
}

/**
 * Create a new LoTE document with required structure
 * Per ETSI TS 119 602, only SchemeOperatorName, ListIssueDateTime and NextUpdate are required
 */
export function createLoTE(
  schemeInfo: Partial<ListAndSchemeInformation> & Pick<ListAndSchemeInformation, 'SchemeOperatorName'>,
  entities: TrustedEntity[] = []
): LoTEDocument {
  const now = new Date()
  const nextYear = new Date(now)
  nextYear.setFullYear(nextYear.getFullYear() + 1)

  const lote: LoTE = {
    ListAndSchemeInformation: {
      LoTEVersionIdentifier: schemeInfo.LoTEVersionIdentifier ?? 1,
      LoTESequenceNumber: schemeInfo.LoTESequenceNumber ?? 1,
      LoTEType: schemeInfo.LoTEType,
      SchemeOperatorName: schemeInfo.SchemeOperatorName,
      SchemeOperatorAddress: schemeInfo.SchemeOperatorAddress,
      SchemeName: schemeInfo.SchemeName,
      SchemeInformationURI: schemeInfo.SchemeInformationURI,
      StatusDeterminationApproach: schemeInfo.StatusDeterminationApproach,
      SchemeTypeCommunityRules: schemeInfo.SchemeTypeCommunityRules,
      SchemeTerritory: schemeInfo.SchemeTerritory,
      PolicyOrLegalNotice: schemeInfo.PolicyOrLegalNotice,
      HistoricalInformationPeriod: schemeInfo.HistoricalInformationPeriod,
      PointersToOtherLoTE: schemeInfo.PointersToOtherLoTE,
      ListIssueDateTime: schemeInfo.ListIssueDateTime ?? now.toISOString(),
      NextUpdate: schemeInfo.NextUpdate ?? nextYear.toISOString(),
      DistributionPoints: schemeInfo.DistributionPoints,
      SchemeExtensions: schemeInfo.SchemeExtensions,
    },
    TrustedEntitiesList: entities,
  }

  return { LoTE: lote }
}

/**
 * Increment the sequence number and update timestamps for a new version
 */
export function updateLoTEVersion(lote: LoTEDocument): LoTEDocument {
  const now = new Date()
  const nextYear = new Date(now)
  nextYear.setFullYear(nextYear.getFullYear() + 1)

  return {
    LoTE: {
      ...lote.LoTE,
      ListAndSchemeInformation: {
        ...lote.LoTE.ListAndSchemeInformation,
        LoTESequenceNumber: lote.LoTE.ListAndSchemeInformation.LoTESequenceNumber + 1,
        ListIssueDateTime: now.toISOString(),
        NextUpdate: nextYear.toISOString(),
      },
    },
  }
}

/**
 * Add a trusted entity to a LoTE document
 */
export function addTrustedEntity(lote: LoTEDocument, entity: TrustedEntity): LoTEDocument {
  return {
    LoTE: {
      ...lote.LoTE,
      TrustedEntitiesList: [...lote.LoTE.TrustedEntitiesList, entity],
    },
  }
}

/**
 * Remove a trusted entity from a LoTE document by name
 */
export function removeTrustedEntity(lote: LoTEDocument, entityName: string): LoTEDocument {
  return {
    LoTE: {
      ...lote.LoTE,
      TrustedEntitiesList: lote.LoTE.TrustedEntitiesList.filter(
        (e) => !e.TrustedEntityInformation.TEName.some((n) => n.value === entityName)
      ),
    },
  }
}
