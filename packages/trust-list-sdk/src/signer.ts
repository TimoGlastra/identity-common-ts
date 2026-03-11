import { parseCertificate } from '@owf/crypto'
import { base64urlEncode } from '@owf/identity-common'
import type { ListAndSchemeInformation, LoTE, SignedTrustList, SignOptions, TrustedEntity, TrustList } from './types'

/**
 * Sign a trust list
 *
 * @param options - Signing options including trust list, key ID, and signer function
 * @returns The signed trust list as a JWS
 *
 * @example Using a local key via @owf/crypto:
 * ```typescript
 * import { ES256 } from '@owf/crypto';
 * import { signTrustList } from '@registrar/trust-list-sdk';
 *
 * const { privateKey } = await ES256.generateKeyPair();
 * const signer = await ES256.getSigner(privateKey);
 * const signed = await signTrustList({
 *   trustList: myTrustList,
 *   keyId: 'trust-list-signer-2025',
 *   signer,
 * });
 * ```
 *
 * @example Using an external KMS:
 * ```typescript
 * const signed = await signTrustList({
 *   trustList: myTrustList,
 *   keyId: 'trust-list-signer-2025',
 *   signer: async (data) => myKms.sign('ES256', data),
 * });
 * ```
 */
export async function signTrustList(options: SignOptions): Promise<SignedTrustList> {
  const { trustList, keyId, algorithm = 'ES256', certificates, signer } = options

  const header: Record<string, unknown> = {
    alg: algorithm,
    typ: 'trustlist+jwt',
    kid: keyId,
  }

  if (certificates && certificates.length > 0) {
    header.x5c = certificates.map(parseCertificate)
  }

  const encodedHeader = base64urlEncode(JSON.stringify(header))
  const encodedPayload = base64urlEncode(JSON.stringify(trustList))
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
    payload: trustList,
  }
}

/**
 * Create a new trust list with required structure
 * Per ETSI TS 119 602, only SchemeOperatorName, ListIssueDateTime and NextUpdate are required
 */
export function createTrustList(
  schemeInfo: Partial<ListAndSchemeInformation> & Pick<ListAndSchemeInformation, 'SchemeOperatorName'>,
  entities: TrustedEntity[] = []
): TrustList {
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
export function updateTrustListVersion(trustList: TrustList): TrustList {
  const now = new Date()
  const nextYear = new Date(now)
  nextYear.setFullYear(nextYear.getFullYear() + 1)

  return {
    LoTE: {
      ...trustList.LoTE,
      ListAndSchemeInformation: {
        ...trustList.LoTE.ListAndSchemeInformation,
        LoTESequenceNumber: trustList.LoTE.ListAndSchemeInformation.LoTESequenceNumber + 1,
        ListIssueDateTime: now.toISOString(),
        NextUpdate: nextYear.toISOString(),
      },
    },
  }
}

/**
 * Add a trusted entity to a trust list
 */
export function addTrustedEntity(trustList: TrustList, entity: TrustedEntity): TrustList {
  return {
    LoTE: {
      ...trustList.LoTE,
      TrustedEntitiesList: [...trustList.LoTE.TrustedEntitiesList, entity],
    },
  }
}

/**
 * Remove a trusted entity from a trust list by name
 */
export function removeTrustedEntity(trustList: TrustList, entityName: string): TrustList {
  return {
    LoTE: {
      ...trustList.LoTE,
      TrustedEntitiesList: trustList.LoTE.TrustedEntitiesList.filter(
        (e) => !e.TrustedEntityInformation.TEName.some((n) => n.value === entityName)
      ),
    },
  }
}
