import { IdentityException } from '@owf/identity-common'

export class SchemaMetaException extends IdentityException {
  constructor(message: string, details?: unknown) {
    super(message, details)
    Object.setPrototypeOf(this, SchemaMetaException.prototype)
    this.name = 'SchemaMetaException'
  }
}
