export function getClientIp(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwardedFor || req.headers.get('x-real-ip') || 'anonymous'
}

export async function readJson(req: Request): Promise<{ ok: true; data: unknown } | { ok: false }> {
  try {
    return { ok: true, data: await req.json() }
  } catch {
    return { ok: false }
  }
}

export function searchParamsToObject(searchParams: URLSearchParams) {
  return Object.fromEntries(searchParams.entries())
}
