import { useCallback, useState } from "react"
import { useSignMessage } from "wagmi"
import { buildJwtMessage, buildJwtTokenFromHex } from "@repo/auth/jwt"
import { useSetApiKey } from "@repo/auth"
import { useEnsureWalletConnected } from "@repo/chain-evm-kit/react"
import type { LoginState } from "./use-login"

/**
 * EVM login as a returned action. `signIn()` connects the wallet, signs the JWT
 * challenge, builds + persists the token, and **returns** it (throws on failure,
 * including user cancellation). No UX in here — the caller's handler awaits
 * `signIn()` and owns the success/error effects (see features/README.md).
 */
export function useEvmLogin({ permissions = ["all"] }: { permissions?: string[] } = {}): {
  status: LoginState
  signIn: () => Promise<string>
} {
  const { ensureWalletConnected } = useEnsureWalletConnected()
  const { signMessageAsync } = useSignMessage()
  const setApiKey = useSetApiKey()
  const [status, setStatus] = useState<LoginState>("idle")

  const signIn = useCallback(async (): Promise<string> => {
    setStatus("pending")
    try {
      // Force a fresh wallet pick on every login so users can switch wallet/account.
      const { address } = await ensureWalletConnected({ forceReconnect: true })
      const { message } = buildJwtMessage({
        address,
        ecosystem: "evm",
        permissions,
      })
      const signature = await signMessageAsync({ message })
      const token = buildJwtTokenFromHex(message, signature)
      setApiKey(token)
      return token
    } finally {
      setStatus("idle")
    }
  }, [ensureWalletConnected, signMessageAsync, setApiKey, permissions])

  return { status, signIn }
}
