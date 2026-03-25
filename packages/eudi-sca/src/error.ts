export class ScaError extends Error {
  constructor(message = new.target.name) {
    super()
    super.message = message
  }
}
