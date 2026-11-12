"use client"
import type { ToSDialogProps } from "@repo/tos-signer-base"
import { useSolana } from "../components/solana-provider"
import { useToSSignerHost } from "./signer"

/**
 * Solana ToS dialog host. Mount once inside the Solana provider so the connected
 * wallet's signer is available. Headless: it drives the app-supplied consent
 * dialog SLOT (`ToSDialogProps`) via `useToSSignerHost` — no `@repo/ui`, no JSX
 * dialog ships here (charter ⊖ ui). Renders nothing until a wallet is connected.
 */
export interface SolanaToSSignerProps {
  /** The app's consent dialog component (from `@repo/components` / app-runtime). */
  dialog: (props: ToSDialogProps) => React.ReactNode
}

export const SolanaToSSigner = ({ dialog }: SolanaToSSignerProps) => {
  const { selectedAccount, isConnected } = useSolana()
  const host = useToSSignerHost()

  if (!selectedAccount || !isConnected) {
    return null
  }

  return dialog({
    open: host.open,
    pending: host.pending,
    tosContent: host.content,
    onConfirm: host.onConfirm,
    onCancel: host.onCancel,
  })
}
