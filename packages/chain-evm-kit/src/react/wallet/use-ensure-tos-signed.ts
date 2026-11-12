"use client"
import { useAccount, usePublicClient } from "wagmi"
import { evmToSSigner, type EvmAddress } from "../tos-signer/signer"
import { formatAddressForTemplate } from "../../tos-signer/format-address"

export interface UseEnsureToSSignedOptions {
  /** Optional override; the default appId comes from the ACS client. */
  appId?: string
  /** The target chain the signature is keyed on. */
  chainId: number
}

export interface UseEnsureToSSignedResult {
  ensureToSSigned: (params?: { skipDialog?: boolean }) => Promise<string>
}

/**
 * Returns a cached ToS signature for `(address, chainId)`, or presents the ToS
 * dialog → signs → caches → returns. The signature feeds `getClaimData`'s `sig`
 * (the `POST /claim` authorization). Requires `<EvmToSSigner>` mounted.
 *
 * Thin wrapper over the matched-set `evmToSSigner.useEnsureToSSigned`: injects
 * `{ chainId }` into the sign payload (so the cache lookup is keyed on the TARGET
 * chain, never live wallet state) and the EVM-lowercase address format. The ToS
 * doc fetch + cache wiring live inside the matched-set hook from `createToSSigner`.
 */
export const useEnsureToSSigned = (
  options: UseEnsureToSSignedOptions,
): UseEnsureToSSignedResult => {
  const { appId, chainId } = options

  const { address } = useAccount()
  const evmAddress = address as EvmAddress | undefined
  const publicClient = usePublicClient({ chainId })

  return evmToSSigner.useEnsureToSSigned({
    address: evmAddress,
    appId,
    formatAddressForTemplate,
    getSignExtra: (params) => ({ payload: { chainId }, ...params }),
    validate: () => {
      if (!publicClient) throw new Error("Public client is required")
    },
  })
}
