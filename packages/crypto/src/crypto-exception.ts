import { IdentityException } from '@owf/identity-common'

/**
 * CryptoException is a custom error class for crypto-related exceptions.
 */
export class CryptoException extends IdentityException {
  constructor(message: string, details?: unknown) {
    super(message, details)
    Object.setPrototypeOf(this, CryptoException.prototype)
    this.name = 'CryptoException'
  }
}
