import { createPublicClient, http, HttpRequestError, TimeoutError } from "viem"

/**
 * Result of probing an EVM RPC endpoint. Mirrors the Solana `validateRpc`
 * shape so the network-picker UI can switch on a uniform result type.
 *
 * The `reason` tag is additive and OPTIONAL — existing consumers key only off
 * `ok` / `corsWarning` / `error`, and keeping it optional preserves
 * assignability with the Solana sibling result (which has no `reason`) at the
 * shared `RpcUrlField` consumer. `validateRpc` always populates it at runtime;
 * it lets newer callers distinguish a genuinely-broken endpoint (DNS /
 * connection refused / 5xx / timeout) from the one case a browser truly cannot
 * verify (an opaque CORS rejection).
 */
export type RpcFailureReason =
  | "invalid-url" // failed the http(s) shape guard
  | "chain-mismatch" // reachable, but served the wrong chain id
  | "unreachable" // request timed out — host down / wrong host / blackholed
  | "http-error" // server answered with a non-ok HTTP status (4xx / 5xx)

export type RpcValidationResult =
  | { ok: true; corsWarning?: false }
  | { ok: true; corsWarning: true; error: string }
  | { ok: false; error: string; reason?: RpcFailureReason }

/**
 * Map a thrown error from the `eth_chainId` probe onto an
 * {@link RpcValidationResult}. Kept pure (no network) so the classification
 * branches are unit-testable with synthetic viem error instances.
 *
 * Browser-fetch caveat: when the underlying `fetch` itself throws, the Fetch
 * spec gives JS the same opaque `TypeError` for a CORS rejection AND for a
 * network failure (DNS, connection refused) — the two are deliberately
 * indistinguishable client-side. viem surfaces that as an `HttpRequestError`
 * with **no** `status`. ONLY that case yields the soft `corsWarning`; every
 * error we can actually classify is reported as `ok: false`.
 */
export function classifyRpcError(err: unknown): RpcValidationResult {
  const message = err instanceof Error ? err.message : "Unknown error"

  // Request timed out (host unreachable / blackholed / wrong host). viem
  // wraps this as `TimeoutError` regardless of retries.
  if (err instanceof TimeoutError) {
    return {
      ok: false,
      reason: "unreachable",
      error: `RPC did not respond (request timed out): ${message}`,
    }
  }

  // Server answered with a non-ok HTTP status and no JSON-RPC error body.
  // A numeric `status` means we genuinely reached a server — it's broken,
  // not CORS-blocked.
  if (err instanceof HttpRequestError && typeof err.status === "number") {
    return {
      ok: false,
      reason: "http-error",
      error: `RPC returned HTTP ${err.status}.`,
    }
  }

  // The remaining case: viem's HTTP transport caught a `fetch` that threw a
  // bare `TypeError` (no status) — the spec-mandated opaque failure that is
  // CORS *or* network and cannot be told apart in a browser. This is the only
  // situation that earns the soft warning.
  return {
    ok: true,
    corsWarning: true,
    error: `Could not verify chain id (likely a CORS-restricted RPC): ${message}`,
  }
}

/**
 * Validate that an RPC URL responds correctly and serves the expected chain.
 * Mirrors the legacy `validateRpc` in `@clique/acs-core`.
 *
 * - `url` must be http(s).
 * - On `eth_chainId` mismatch with `expectedChainId`, returns `ok: false`
 *   (`reason: 'chain-mismatch'`).
 * - A timeout or a non-ok HTTP status is a genuinely-broken endpoint →
 *   `ok: false` with a distinct `reason`.
 * - Only an opaque `fetch` failure (CORS *or* indistinguishable network error,
 *   per the Fetch spec) yields `ok: true` + `corsWarning`.
 *
 * `retryCount: 0` + an explicit `timeout` keep a broken endpoint from
 * silently retrying for ~30s before surfacing.
 */
export async function validateRpc(
  url: string,
  expectedChainId: number,
): Promise<RpcValidationResult> {
  if (!/^https?:\/\/.+/.test(url)) {
    return {
      ok: false,
      reason: "invalid-url",
      error: "RPC URL must start with http(s)://",
    }
  }

  let reported: number
  try {
    const client = createPublicClient({
      transport: http(url, { timeout: 5000, retryCount: 0 }),
    })
    reported = await client.getChainId()
  } catch (err) {
    return classifyRpcError(err)
  }

  if (reported !== expectedChainId) {
    return {
      ok: false,
      reason: "chain-mismatch",
      error: `RPC reports chain ${reported}, expected ${expectedChainId}.`,
    }
  }
  return { ok: true }
}
