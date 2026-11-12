"use client"
import { type Address, type Hash } from "viem"
import type { BatchFeeConfig } from "@repo/airdrop-base/distributor"
import { useFeeMode } from "./use-fee-mode"
import { useFixedFee } from "./use-fixed-fee"
import { useSingleTierFeeRate } from "./use-single-tier-fee-rate"

export type UseFeeConfigParameters = {
  chainId: number
  distributor: Address | undefined
  root: Hash | undefined
}

/**
 * Composed distributor fee reader: reads `Distributor.feeModes(root)` then the
 * matching detail read, decoding to the chain-free `BatchFeeConfig` union. The
 * EVM half of the fee-decode symmetry (the Solana half is `useFeeConfig` in
 * `@repo/airdrop-solana` — same name, one PDA read + decode in its queryOptions).
 *
 * `feeModes(root)` gives the on-chain enum (`Default=0, Fixed=1, SingleTier=2`):
 *   - 0 → `null` (not configured)
 *   - 1 → `fixedFees(root)` → `{ kind: "fixed", amount }`
 *   - 2/other → `singleTierFeeRates(root)` → `{ kind: "single-tier", … }`
 *
 * Both detail reads always mount (Rules of Hooks); only the mode-matching one is
 * enabled. Returns the DECODED value directly (`undefined` = resolving/inactive,
 * `null` = no fee set, `BatchFeeConfig` = decoded) rather than a query result:
 * the decode fans across three composed reads where the detail read depends on
 * the mode, so a single queryOptions can't express it — the deliberate shape
 * asymmetry with the single-PDA Solana arm. The hook self-skips (returns
 * `undefined`) while `distributor`/`root` are absent — the inactive chain, or a
 * batch with no distributor yet.
 */
export const useFeeConfig = (
  parameters: UseFeeConfigParameters,
): BatchFeeConfig | null | undefined => {
  const { chainId, distributor, root } = parameters

  const modeQuery = useFeeMode({ chainId, distributor, root })
  const mode = modeQuery.data

  const fixedQuery = useFixedFee({
    chainId,
    distributor,
    root,
    query: { enabled: mode === 1 },
  })
  const singleTierQuery = useSingleTierFeeRate({
    chainId,
    distributor,
    root,
    query: { enabled: mode === 2 },
  })

  if (mode == null) return undefined
  if (mode === 0) return null

  if (mode === 1) {
    if (fixedQuery.data == null) return undefined
    return { kind: "fixed", amount: fixedQuery.data }
  }

  if (singleTierQuery.data == null) return undefined
  const { feeRate, minFee, maxFee } = singleTierQuery.data
  return { kind: "single-tier", rate: feeRate, minFee, maxFee }
}
