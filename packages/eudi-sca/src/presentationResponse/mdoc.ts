import { cborEncode } from '@owf/mdoc'
import {
  type CreateScaPresentationResponseDeviceNamespacesOptions,
  SCA_PRESENTATION_RESPONSE_DEVICE_NAMESPACES_NAMESPACE,
} from '.'

/**
 *
 * Create a device namespace to-be-added by the user to the device authentication and sign afterwards
 *
 */
export const createScaPresentationResponseDeviceNamespaces = (
  options: CreateScaPresentationResponseDeviceNamespacesOptions
) => {
  const jti = options.jti
  const responseMode = options.responseMode
  const displayLocale = options.displayLocale
  const amr = cborEncode(options.amr)
  const { hash, algorithm } = options.hasher(options.transactionData)
  const metadataIntegrity = options.metadataIntegrity

  return {
    [SCA_PRESENTATION_RESPONSE_DEVICE_NAMESPACES_NAMESPACE]: {
      jti,
      response_mode: responseMode,
      display_locale: displayLocale,
      amr,
      transaction_data_hash: hash,
      transaction_data_hash_alg: algorithm,
      metadata_integrity: metadataIntegrity,
    },
  }
}
