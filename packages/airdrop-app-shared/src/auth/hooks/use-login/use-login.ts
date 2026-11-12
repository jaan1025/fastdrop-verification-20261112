import { match } from "@repo/shared/utils"
import { useEvmLogin } from "./use-evm-login"
import { useSolanaLogin } from "./use-solana-login"

/** Which ecosystem login leaf to run. Carried explicitly; never sniffed (L4). */
export type LoginKind = "evm" | "solana"

/** The shared transient login state both leaves expose. */
export type LoginState = "idle" | "pending"

export interface UseLoginResult {
  status: LoginState
  signIn: () => Promise<string>
}

/**
 * Login facade: one `useLogin(kind)` that dispatches via `match(kind)` to the
 * paired `-evm`/`-solana` login leaves, exposing a single `{ status, signIn }`
 * shape. Both leaf hooks are called unconditionally and the result is selected by
 * `kind` (hook-rules-safe). The only per-chain delta is which leaf runs (and the
 * icon/label on `LoginButton`).
 *
 * Owns the connect choreography only: success-redirect / inspect orchestration
 * is BANNED here — it lives in `useLoginSuccessHandler` (no UX side-effects in
 * this hook). `signIn` resolves to the persisted JWT (throws on failure incl.
 * user cancellation); the caller's handler owns success/error.
 */
export function useLogin(kind: LoginKind, options?: { permissions?: string[] }): UseLoginResult {
  const evm = useEvmLogin(options)
  const solana = useSolanaLogin(options)
  return match(kind, {
    evm: () => evm,
    solana: () => solana,
  })
}
