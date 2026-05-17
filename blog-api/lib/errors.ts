export class ValidationError extends Error {
  constructor(
    message: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}
