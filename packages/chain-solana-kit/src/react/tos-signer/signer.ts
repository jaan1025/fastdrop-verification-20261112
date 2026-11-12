"use client"
import { createToSSigner } from "@repo/tos-signer-base"
import type { Address } from "@solana/kit"
import { usePublicClient } from "@repo/acs-client/react"
import { useSolana } from "../components/solana-provider"
import { useSignMessage } from "../signing/use-sign-message"

/**
 * The Solana ToS-signer matched set — ONE `createToSSigner(config)` call
 * (private-`Symbol` channel; the legacy stringly `eventName` is gone). Supplies
 * Solana's `signMessage` (strategy chosen inside the hook from wallet
 * capabilities), base58-verbatim address formatting (never lowercased — the
 * documented inverse of EVM), and the per-chain `storagePrefix`.
 *
 * Because `signMessage` needs the live connected wallet, the config is built
 * with a getter the host re-binds at mount (`useSolanaToSSigner` below) — the
 * factory is instantiated once at module scope, and the host injects the live
 * signer via the `signMessage` indirection.
 */
const STORAGE_PREFIX = "tos-signature-solana"

// A module-level mutable seam so the single factory instance can reach the live
// `signMessage` resolved by the host hook (the wallet signer is only available
// inside React). The host sets this before any sign request is dispatched.
let liveSignMessage: ((message: string) => Promise<string>) | null = null

const solanaToSSigner = createToSSigner<Address, string>({
  storagePrefix: STORAGE_PREFIX,
  lowercaseKeys: false, // base58 — never lowercase Solana
  missingAddressError: "Connect your Solana wallet first.",
  missingMessageError: "Message is not set",
  signMessage: async (_address, message) => {
    if (!liveSignMessage) {
      throw new Error("Connect your Solana wallet first.")
    }
    return liveSignMessage(message)
  },
})

export const useSignToS = solanaToSSigner.useSignToS
export const useToSSignatureStore = solanaToSSigner.useToSSignatureStore

/**
 * Bind the host to the live wallet `signMessage` + address. Returns the headless
 * host state for the app's dialog slot. Mounted once by `SolanaToSSigner`.
 */
export const useToSSignerHost = () => {
  const { selectedAccount } = useSolana()
  const address = selectedAccount?.address as Address | undefined
  const { signMessage } = useSignMessage()
  // Re-bind the live signer on every render so the host always signs with the
  // current wallet (fresh after a mid-flow connect).
  liveSignMessage = (message: string) => signMessage({ message })
  return solanaToSSigner.useToSSignerHost({ address })
}

/**
 * Returns a cached ToS signature for the connected Solana address, or presents
 * the ToS dialog → signs → caches → returns. The signature feeds
 * `getClaimData`'s `sig` (the `POST /claim` authorization). Requires
 * `<SolanaToSSigner>` mounted in the tree. `appId` is sourced from the ACS
 * client (no param).
 */
export const useEnsureToSSigned = () => {
  const { selectedAccount } = useSolana()
  const address = selectedAccount?.address as Address | undefined
  const publicClient = usePublicClient()
  // The base ensure hook fetches the ToS doc and keys the matched store on its
  // live hash, so no ToS fetch is needed here.

  return solanaToSSigner.useEnsureToSSigned({
    address,
    validate: () => {
      if (!publicClient) throw new Error("Public client is required")
    },
  })
}
