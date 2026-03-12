/**
 * IdentityException is the base error class for all identity-common-ts packages.
 *
 * Package-specific exception classes should extend this class.
 */
export class IdentityException extends Error {
  public details?: unknown

  constructor(message: string, details?: unknown) {
    super(message)
    Object.setPrototypeOf(this, IdentityException.prototype)
    this.name = 'IdentityException'
    this.details = details
  }

  getFullMessage(): string {
    return `${this.name}: ${this.message} ${this.details ? `- ${JSON.stringify(this.details)}` : ''}`
  }
}
