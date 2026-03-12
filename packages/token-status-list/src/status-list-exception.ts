import { IdentityException } from '@owf/identity-common'

/**
 * SLException is a custom error class for Status List related exceptions.
 */
export class SLException extends IdentityException {
  constructor(message: string, details?: unknown) {
    super(message, details)
    Object.setPrototypeOf(this, SLException.prototype)
    this.name = 'SLException'
  }
}
