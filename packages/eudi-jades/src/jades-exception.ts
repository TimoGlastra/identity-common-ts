/**
 * JAdES Exception
 *
 * Custom exception for JAdES-related errors.
 */

export class JAdESException extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JAdESException'
    Object.setPrototypeOf(this, JAdESException.prototype)
  }
}
