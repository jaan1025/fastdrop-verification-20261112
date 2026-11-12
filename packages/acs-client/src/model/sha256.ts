/**
 * [golden-test] Async SHA-256 over a UTF-8 string, returning a `0x`-prefixed
 * lowercase hex digest. Uses Web Crypto (available in browsers and Node 19+).
 * Underpins CSV `deriveBatchName` and ToS `buildTosHash`.
 */
export const sha256Hex = async (input: string): Promise<`0x${string}`> => {
  const bytes = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest("SHA-256", bytes)
  let hex = ""
  for (const b of new Uint8Array(buf)) hex += b.toString(16).padStart(2, "0")
  return `0x${hex}` as `0x${string}`
}
