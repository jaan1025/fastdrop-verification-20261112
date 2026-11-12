/**
 * Result of probing a Solana RPC endpoint. Mirrors the EVM `validateRpc`
 * shape so the network-picker UI can switch on a uniform result type.
 */
export type RpcValidationResult =
  | { ok: true; corsWarning?: false }
  | { ok: true; corsWarning: true; error: string }
  | { ok: false; error: string }

/**
 * Probe a Solana RPC endpoint via `getVersion`. Mirrors EVM `validateRpc`
 * shape so the network-picker UI can switch on a uniform result type.
 *
 * - `url` must be http(s).
 * - When the request throws (CORS / DNS / 5xx), return `corsWarning` — the
 *   endpoint may still be usable server-side but the browser cannot verify.
 */
export async function validateRpc(url: string): Promise<RpcValidationResult> {
  if (!/^https?:\/\/.+/.test(url)) {
    return { ok: false, error: "RPC URL must start with http(s)://" }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getVersion",
      }),
      signal: controller.signal,
    })
    if (!response.ok) {
      return { ok: false, error: `RPC returned HTTP ${response.status}` }
    }
    const data = await response.json()
    if (data?.result?.["solana-core"]) {
      return { ok: true }
    }
    return { ok: false, error: "Invalid Solana RPC response" }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, error: "RPC request timed out" }
    }
    const message = err instanceof Error ? err.message : "Unknown error"
    return {
      ok: true,
      corsWarning: true,
      error: `Could not verify (likely CORS-restricted): ${message}`,
    }
  } finally {
    clearTimeout(timeout)
  }
}
