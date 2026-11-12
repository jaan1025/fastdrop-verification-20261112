import type { ReactNode } from "react"
import { LoadingButton } from "@repo/ui/components/loading-button"
import { toast } from "@repo/ui/components/sonner"
import NetworkEthereum from "@web3icons/react/icons/networks/NetworkEthereum"
import NetworkSolana from "@web3icons/react/icons/networks/NetworkSolana"
import { extractErrorMessage } from "@repo/shared/errors"
import { useLogin, type LoginKind } from "../hooks/use-login"
import { isCancelled } from "../utils/login-error"

export interface LoginButtonProps {
  /** Which ecosystem to sign in with; selects the icon/label and the login leaf. */
  kind: LoginKind
  /** Called with the JWT after a successful sign-in. */
  onSuccess: (token: string) => void
  disabled?: boolean
  /** JWT permission scope forwarded to `useLogin`. */
  permissions?: string[]
}

// The one per-chain data delta: adding a chain is ONE entry here, not a new file.
const KIND_META: Record<LoginKind, { icon: ReactNode; label: string; fallbackError: string }> = {
  evm: {
    icon: <NetworkEthereum variant="branded" size={18} className="shrink-0" />,
    label: "EVM",
    fallbackError: "Failed to sign in with EVM",
  },
  solana: {
    icon: <NetworkSolana variant="branded" size={18} className="shrink-0" />,
    label: "Solana",
    fallbackError: "Failed to sign in with Solana",
  },
}

/**
 * The single kind-driven wallet sign-in button: drives `useLogin(kind)`, shows a
 * loading state while signing, reports the token via `onSuccess`, and toasts
 * non-cancellation errors. Replaces the two byte-identical
 * `EvmLoginButton`/`SolanaLoginButton` — the only per-chain delta is the icon +
 * label, resolved from `KIND_META`. The UX side-effects live here (component
 * handler), not in the hook.
 */
export function LoginButton({ kind, onSuccess, disabled, permissions }: LoginButtonProps) {
  const { status, signIn } = useLogin(kind, { permissions })
  const meta = KIND_META[kind]

  const handleClick = async () => {
    try {
      onSuccess(await signIn())
    } catch (err) {
      if (!isCancelled(err)) {
        toast.error(extractErrorMessage(err, meta.fallbackError))
      }
    }
  }

  return (
    <LoadingButton
      variant="outline"
      size="md"
      onClick={handleClick}
      loading={status === "pending"}
      disabled={disabled}
    >
      {meta.icon}
      {meta.label}
    </LoadingButton>
  )
}
