/**
 * LoTE Validator
 *
 * Runtime validation for ETSI TS 119 602 LoTE documents using Zod schemas.
 */

import { LoTEDocumentSchema } from './schemas'
import type { LoTEDocument } from './types'

/**
 * Validation error detail
 */
export interface ValidationError {
  /** Path to the invalid field */
  path: string
  /** Error message */
  message: string
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the LoTE document is valid */
  valid: boolean
  /** List of validation errors (if invalid) */
  errors: ValidationError[]
}

/**
 * Validate a LoTE document against ETSI TS 119 602 schema
 *
 * @param loteDocument - The LoTE document to validate
 * @returns Validation result with errors if invalid
 *
 * @example
 * ```typescript
 * const result = validateLoTE(myLoTE);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function validateLoTE(loteDocument: unknown): ValidationResult {
  const result = LoTEDocumentSchema.safeParse(loteDocument)

  if (result.success) {
    return { valid: true, errors: [] }
  }

  const errors: ValidationError[] = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))

  return { valid: false, errors }
}

/**
 * Assert that a LoTE document is valid, throwing if not
 *
 * @param loteDocument - The LoTE document to validate
 * @throws Error if validation fails
 */
export function assertValidLoTE(loteDocument: unknown): asserts loteDocument is LoTEDocument {
  const result = validateLoTE(loteDocument)
  if (!result.valid) {
    const errorMessages = result.errors.map((e) => `${e.path}: ${e.message}`).join('\n')
    throw new Error(`Invalid LoTE document:\n${errorMessages}`)
  }
}
