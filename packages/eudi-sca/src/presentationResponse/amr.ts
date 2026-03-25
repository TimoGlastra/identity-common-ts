import z from 'zod'

export enum AmrKnowledge {
  PinLessThan6Digits = 'pin_less_than_6_digits',
  Pin6OrMoreDigits = 'pin_6_or_more_digits',
  PassphraseLessThan8Chars = 'passphrase_less_than_8_chars',
  Passphrase8To11Chars = 'passphrase_8_to_11_chars',
  Passphrase12OrMoreChars = 'passphrase_12_or_more_chars',
  Pattern = 'pattern',
  Other = 'other',
}

export enum AmrPossession {
  KeyInRemoteWscd = 'key_in_remote_wscd',
  KeyInLocalExternalWscd = 'key_in_local_external_wscd',
  KeyInLocalInternalWscd = 'key_in_local_internal_wscd',
  KeyInLocalNativeWscd = 'key_in_local_native_wscd',
  Other = 'other',
}

export enum AmrInherence {
  FingerprintDevice = 'fingerprint_device',
  FingerprintExternal = 'fingerprint_external',
  FaceDevice = 'face_device',
  FaceExternal = 'face_external',
  Other = 'other',
}

export const zAuthenticationMethodsReferencesSchema = z
  .array(
    z.union([
      z.object({
        knowledge: z.enum(AmrKnowledge),
      }),
      z.object({
        possession: z.enum(AmrPossession),
      }),
      z.object({
        inherence: z.enum(AmrInherence),
      }),
    ])
  )
  .min(2, 'AMR must contain at least two authentication category objects')
  .refine((entries) => new Set(entries.map((e) => Object.keys(e)[0])).size === entries.length, {
    message: 'Each AMR entry must represent a different authentication category',
  })

export type AuthenticationMethodsReferences = z.infer<typeof zAuthenticationMethodsReferencesSchema>

/**
 *
 * Create a list of Authentication Methods References
 *
 * Make sure to provide at least TWO items
 *
 */
export const createAmr = (
  options:
    | { inherence: AmrInherence; possession: AmrPossession; knowledge?: AmrKnowledge }
    | { inherence: AmrInherence; knowledge: AmrKnowledge; possession?: AmrPossession }
    | { possession: AmrPossession; knowledge: AmrKnowledge; inherence?: AmrInherence }
) => {
  return zAuthenticationMethodsReferencesSchema.parse(
    [
      options.knowledge !== undefined ? { knowledge: options.knowledge } : undefined,
      options.possession !== undefined ? { possession: options.possession } : undefined,
      options.inherence !== undefined ? { inherence: options.inherence } : undefined,
    ].filter(Boolean)
  )
}
