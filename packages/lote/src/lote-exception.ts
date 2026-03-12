import { IdentityException } from '@owf/identity-common'

/**
 * LoTEException is a custom error class for LoTE-related exceptions.
 */
export class LoTEException extends IdentityException {
  constructor(message: string, details?: unknown) {
    super(message, details)
    Object.setPrototypeOf(this, LoTEException.prototype)
    this.name = 'LoTEException'
  }
}
