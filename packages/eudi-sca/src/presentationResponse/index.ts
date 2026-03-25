import type { AuthenticationMethodsReferences } from '../schemas/authentication-methods-references'

export const SCA_PRESENTATION_RESPONSE_DEVICE_NAMESPACES_NAMESPACE = 'eu.eudiw.sca'

export type CreateScaPresentationResponseDeviceNamespacesOptions = {
  /**
   *
   * A fresh, cryptographically random value with sufficient entropy, as defined in [RFC7519] Section 4.1.7. This value SHALL be unique for each presentation. Once verified, it serves as the Authentication Code required by [PSD2] for electronic payments.
   *
   */
  jti: string

  /**
   *
   * The value of the response_mode parameter as given or defaulted in the [OID4VP] Authorization Request. If the Authorization Request did not explicitly include response_mode, the Wallet Unit SHALL use the default value as defined by [OID4VP]. The value may be used to evaluate the [OID4VP] implementation of a Relying Party in case the Presentation is used in a Third-party-requested flow.
   *
   */
  responseMode: string

  /**
   *
   * language tag as defined in [RFC5646] representing the locale selected for the transaction as determined in Section 3.5.4. This value serves as the deterministic input to the Lookup matching procedure defined in that section, enabling a Relying Party to independently verify which display entries were used to render the transaction data.
   *
   */
  displayLocale: string

  /**
   *
   * A language tag as defined in [RFC5646] representing the locale selected for the transaction as determined in Section 3.5.4. This value serves as the deterministic input to the Lookup matching procedure defined in that section, enabling a Relying Party to independently verify which display entries were used to render the transaction data.
   *
   */

  /**
   *
   * Authentication Methods References. A JSON array (for [SD-JWT-VC]) or CBOR array (for [mdoc]) that documents the authentication factors successfully applied by the Wallet Unit to authorize the presentation. This is required to satisfy the traceability requirements of the [PSD2] Regulatory Technical Standards (RTS).
   *
   */
  amr: AuthenticationMethodsReferences

  /**
   *
   * a base64url-encoded JSON object that contains a typed parameter set with details about the transaction that the Verifier is requesting the End-User to authorize
   *
   */
  transactionData: string

  hasher: (transactionData: string) => {
    hash: string
    algorithm: string
  }

  /**
   *
   * The [W3C.SRI] integrity value of the signed credential configuration JWT that was used to display the transaction data to the User during this presentation (see Section 4.1.2). This enables the Relying Party to independently verify that the metadata used for the consent screen was authentic and unmodified.
   *
   */
  metadataIntegrity: string
}
