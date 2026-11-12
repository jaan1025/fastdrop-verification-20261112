import type { ComponentType, ReactNode } from "react"
import type { ToSDialogProps } from "@repo/tos-signer-base"
import { EvmToSSigner } from "@repo/chain-evm-kit/tos-signer"
import { SolanaToSSigner } from "@repo/chain-solana-kit/tos-signer"

export interface TosSignerHostsProps {
  /**
   * The app-supplied consent dialog conforming to the `ToSDialogProps` slot. The
   * concrete dialog (markdown + scroll-gate) lives in the app / `@repo/components`;
   * the headless chain hosts only drive its state. One dialog component is shared
   * by both ecosystems — each host mounts its own instance inside its wallet tree.
   */
  Dialog: ComponentType<ToSDialogProps>
}

/**
 * Named root part (portal-only): composes the EVM + Solana ToS dialog hosts as a
 * typed unit the portal renders by forwarding the two named nodes into
 * `ProviderStack`'s `evmTosHost` / `solanaTosHost` slots, so each host lands in
 * its own wallet tree. Replaces the legacy `evmToSSigner?`/`solanaToSSigner?`
 * `ReactNode` slots threaded through three layers.
 *
 * The chain SDKs own the headless host machines (`EvmToSSigner` /
 * `SolanaToSSigner`); this part only pairs each with the app's dialog slot.
 *
 * Returns two named nodes (not one slot grab-bag) so neither host is ever
 * stranded: `evm` mounts inside the wagmi tree (its `useSignMessage` resolves),
 * `solana` inside the Solana wallet tree (its `useSolana` resolves).
 */
export function TosSignerHosts({ Dialog }: TosSignerHostsProps): {
  evm: ReactNode
  solana: ReactNode
} {
  return {
    evm: <EvmTosHost Dialog={Dialog} />,
    solana: <SolanaTosHost Dialog={Dialog} />,
  }
}

/** EVM ToS host: pass as `ProviderStack`'s `evmTosHost`. */
export function EvmTosHost({ Dialog }: { Dialog: ComponentType<ToSDialogProps> }) {
  return <EvmToSSigner Dialog={Dialog} />
}

/** Solana ToS host: pass as `ProviderStack`'s `solanaTosHost`. */
export function SolanaTosHost({ Dialog }: { Dialog: ComponentType<ToSDialogProps> }) {
  return <SolanaToSSigner dialog={(props) => <Dialog {...props} />} />
}
