const PROTOCOL_RELATIVE = /^\/[/\\]/

/**
 * Reject anything that isn't a same-origin path — blocks `?next=https://evil`
 * open redirects. Also rejects the protocol-relative forms (`//host`, `/\host`,
 * and their encoded variants) the browser would normalize off-origin, checked
 * both raw and after one `decodeURIComponent`. Returns the original value when
 * safe, else `undefined` (caller falls back to its home route).
 *
 * Single source for all three apps' login redirect guard — the hardened form
 * the portal carried; the consoles previously shipped a weaker `//`-only check.
 */
export function sanitizeNext(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  if (!raw.startsWith("/") || PROTOCOL_RELATIVE.test(raw)) return undefined
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return undefined
  }
  if (!decoded.startsWith("/") || PROTOCOL_RELATIVE.test(decoded)) {
    return undefined
  }
  return raw
}
