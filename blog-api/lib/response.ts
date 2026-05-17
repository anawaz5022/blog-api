type Meta = Record<string, unknown>

export type ApiSuccess<T> = {
  data: T
  meta?: Meta
}

export type ApiError = {
  error: string
  details?: unknown
}

function json<T>(body: T, status: number, headers?: HeadersInit) {
  return Response.json(body, { status, headers })
}

export function ok<T>(data: T, meta?: Meta) {
  const body: ApiSuccess<T> = meta ? { data, meta } : { data }
  return json(body, 200)
}

export function created<T>(data: T, meta?: Meta) {
  const body: ApiSuccess<T> = meta ? { data, meta } : { data }
  return json(body, 201)
}

export function err(error: string, status = 400, details?: unknown, headers?: HeadersInit) {
  const body: ApiError = details === undefined ? { error } : { error, details }
  return json(body, status, headers)
}

export function unauthorized(message = 'Unauthorized') {
  return err(message, 401)
}

export function forbidden(message = 'Forbidden') {
  return err(message, 403)
}

export function notFound(resource = 'Resource') {
  return err(`${resource} not found`, 404)
}

export function conflict(message = 'Resource already exists', details?: unknown) {
  return err(message, 409, details)
}

export function unprocessable(details?: unknown) {
  return err('Validation failed', 422, details)
}

export function tooManyRequests(retryAfterSeconds = 60) {
  return err('Too many requests', 429, undefined, {
    'Retry-After': String(Math.max(1, retryAfterSeconds)),
  })
}

export function serverError() {
  return err('Internal server error', 500)
}
