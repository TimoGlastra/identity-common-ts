import type { CreateScaPresentationResponseDeviceNamespacesOptions } from '.'

export const createScaPresentationResponseKeyBindingClaims = (
  options: CreateScaPresentationResponseDeviceNamespacesOptions
) => {
  const jti = options.jti
  const responseMode = options.responseMode
  const displayLocale = options.displayLocale
  const amr = options.amr
  const { hash, algorithm } = options.hasher(options.transactionData)
  const metadataIntegrity = options.metadataIntegrity

  return {
    jti,
    response_mode: responseMode,
    display_locale: displayLocale,
    amr,
    transaction_data_hash: hash,
    transaction_data_hash_alg: algorithm,
    metadata_integrity: metadataIntegrity,
  }
}
