"use client"
import { type ComponentType, useEffect } from "react"
import { useAccount, useSignMessage } from "wagmi"
import type { ToSDialogProps } from "@repo/tos-signer-base"
import { useEnsureChainSwitched } from "../wallet/use-ensure-chain-switched"
import { evmToSSigner, setEvmSignerRuntime, type EvmAddress } from "./signer"

export interface EvmToSSignerProps {
  /**
   * The app-supplied consent dialog conforming to the `ToSDialogProps` slot. The
   * concrete dialog (markdown + scroll-gate) lives in `@repo/components` / the
   * app; this headless leaf only drives its state.
   */
  Dialog: ComponentType<ToSDialogProps>
}

/**
 * EVM ToS host. Mount once inside the wagmi provider so the connected wallet is
 * available for signing. Injects the live wagmi `signMessageAsync` +
 * `ensureChainSwitched` into the module-scoped signer runtime, drives the
 * headless host machine, and renders the app's dialog slot. Renders nothing
 * (still wires the host) until a wallet is connected.
 */
export const EvmToSSigner = ({ Dialog }: EvmToSSignerProps) => {
  const { address } = useAccount()
  // wagmi types `address` as `string | undefined` under the repo's viem skew;
  // it is always a hex address. Narrow so the signer's `Address` generic
  // resolves to `0x${string}`.
  const evmAddress = address as EvmAddress | undefined
  const { signMessageAsync } = useSignMessage()
  const { ensureChainSwitched } = useEnsureChainSwitched()

  // Publish the live wagmi capabilities for the module-init factory config to
  // delegate to (the base host override only accepts `{ address }`).
  useEffect(() => {
    setEvmSignerRuntime({
      signMessageAsync: (args) =>
        signMessageAsync({ message: args.message }) as Promise<EvmAddress>,
      ensureChainSwitched,
    })
  }, [signMessageAsync, ensureChainSwitched])

  const host = evmToSSigner.useToSSignerHost({ address: evmAddress })

  return (
    <Dialog
      open={host.open}
      pending={host.pending}
      tosContent={host.content}
      onConfirm={host.onConfirm}
      onCancel={host.onCancel}
    />
  )
}
