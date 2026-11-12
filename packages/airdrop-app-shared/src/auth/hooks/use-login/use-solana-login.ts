import { useCallback, useState } from "react"
import { buildJwtMessage, buildJwtTokenFromBytes } from "@repo/auth/jwt"
import { useSetApiKey } from "@repo/auth"
import { useEnsureWalletConnected, useWalletSigners } from "@repo/chain-solana-kit/react"
import type { LoginState } from "./use-login"

/**
 * Solana login as a returned action. `signIn()` connects the wallet, signs the
 * JWT challenge, builds + persists the token, and **returns** it (throws on
 * failure, including user cancellation). No UX in here — the caller's handler
 * awaits `signIn()` and owns the success/error effects (see features/README.md).
 */
export function useSolanaLogin({ permissions = ["all"] }: { permissions?: string[] } = {}): {
  status: LoginState
  signIn: () => Promise<string>
} {
  const { ensureWalletConnected } = useEnsureWalletConnected()
  // Getter reads the live signer at call time — fresh right after the mid-flow
  // connect below, so no render-captured staleness (no ref mirror needed).
  const { getSignMessage } = useWalletSigners()
  const setApiKey = useSetApiKey()
  const [status, setStatus] = useState<LoginState>("idle")

  const signIn = useCallback(async (): Promise<string> => {
    setStatus("pending")
    try {
      // Force a fresh wallet pick on every login so users can switch wallet/account.
      const { account } = await ensureWalletConnected({ forceReconnect: true })
      // Deliberately the RAW wallet-standard `solana:signMessage` (64-byte
      // ed25519), NOT the SquadsX-aware `useSignMessage` from @repo/chain-solana-kit.
      // The auth JWT is verified by clique-acs `valid_token` (auth/permissions.rs),
      // whose ED25519 branch only accepts a plain 64-byte ed25519 signature.
      // The SquadsX commit-reveal (hex, 100-byte) and Ledger memo-tx (base64 wire
      // tx) formats are understood by a *different* verifier (`verify_signature`,
      // types.rs), used only for ToS/claim message checks — never for the JWT.
      // So routing login through SquadsX here is pointless until ACS adds a
      // commit-reveal branch to `valid_token`: the token would just be rejected.
      // → SquadsX multisig cannot log in via this flow.
      const signMessage = getSignMessage()
      // A null raw signer means the account can't produce the 64-byte ed25519
      // message signature this flow requires — it doesn't expose
      // `solana:signMessage` (SquadsX multisig, bare hardware wallet). That's a
      // capability gap, not a connection failure — say so.
      if (!signMessage) throw new Error("This wallet isn't supported for login.")
      const { message } = buildJwtMessage({
        address: account.address,
        ecosystem: "solana",
        permissions,
      })
      const { signature } = await signMessage({
        message: new TextEncoder().encode(message),
      })
      const token = buildJwtTokenFromBytes(message, new Uint8Array(signature))
      setApiKey(token)
      return token
    } finally {
      setStatus("idle")
    }
  }, [ensureWalletConnected, getSignMessage, setApiKey, permissions])

  return { status, signIn }
}
