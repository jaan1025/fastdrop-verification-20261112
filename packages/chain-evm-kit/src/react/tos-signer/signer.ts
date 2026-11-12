"use client"
import { createToSSigner, type ResolveStorageKey } from "@repo/tos-signer-base"

/** Chain target carried into `signMessage` so the host can switch networks. */
export interface ToSPayload {
  chainId: number
}

export type EvmAddress = `0x${string}`

/**
 * Live wagmi capabilities the host injects each render. `createToSSigner` is a
 * module-init call whose `config.signMessage`/`ensureReady` cannot capture React
 * hooks, while the wagmi `signMessageAsync` + chain-switch are per-render. This
 * module-scoped seam bridges the two: `host.tsx` writes the current functions on
 * mount, the factory config delegates to them. The base factory's host override
 * only accepts `{ address }`, so this is the sanctioned injection point for the
 * EVM leaf (see MIGRATION — deviation forced by the wave-1 base API).
 */
interface EvmSignerRuntime {
  signMessageAsync: (args: { message: string }) => Promise<EvmAddress>
  ensureChainSwitched: (targetChainId?: number) => Promise<void>
}

let runtime: EvmSignerRuntime | null = null

/** Set by `host.tsx` each render with the live wagmi capabilities. */
export const setEvmSignerRuntime = (next: EvmSignerRuntime): void => {
  runtime = next
}

const evmStorageKeyResolver: ResolveStorageKey<EvmAddress, ToSPayload> = ({ address, payload }) =>
  // Key on the signing request's TARGET chain (payload.chainId), matching the
  // read side. Live wallet state is unusable here: `ensureReady` switches the
  // wallet mid-flow, so a wallet-derived key races the re-render.
  payload?.chainId ? `${address}-${payload.chainId}` : address

/**
 * The EVM ToS leaf: ONE `createToSSigner` call wiring the EVM-lowercase address
 * format, the per-(address, chainId) storage-key resolver, the
 * `'tos-signature-evm'` storage prefix, and the wagmi sign/switch capabilities
 * (via the module-scoped runtime seam). The private-`Symbol` channel removes the
 * legacy stringly `'sign-tos-evm'` event-name hazard.
 */
export const evmToSSigner = createToSSigner<EvmAddress, string, ToSPayload>({
  storagePrefix: "tos-signature-evm",
  lowercaseKeys: true,
  getStorageKey: evmStorageKeyResolver,
  missingAddressError:
    "Connect your wallet first. If you are using a smart contract wallet, switch to the correct chain.",
  ensureReady: async (options) => {
    const targetChainId = options?.payload?.chainId
    if (!targetChainId) {
      throw new Error("Chain ID is not set")
    }
    if (!runtime) {
      throw new Error("EVM ToS signer runtime is not mounted")
    }
    await runtime.ensureChainSwitched(targetChainId)
  },
  signMessage: async (_address, message) => {
    if (!runtime) {
      throw new Error("EVM ToS signer runtime is not mounted")
    }
    return runtime.signMessageAsync({ message })
  },
})

export const { useSignToS, useToSSignerHost, useEnsureToSSigned, useToSSignatureStore } =
  evmToSSigner
