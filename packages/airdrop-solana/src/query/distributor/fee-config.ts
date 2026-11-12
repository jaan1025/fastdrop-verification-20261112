import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { queryOptions, skipToken } from "@tanstack/react-query"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import type { BatchFeeConfig } from "@repo/airdrop-base/distributor"
import { hexToBytes } from "@repo/shared/utils"
import { getFeeConfigPDA, fetchFeeConfig } from "../../contracts/distributor/functions"
import { airdropSolanaKeys } from "../keys"

export type SolanaFeeConfigData = BatchFeeConfig | null
export type SolanaFeeConfigQueryKey = ReturnType<typeof airdropSolanaKeys.feeConfig>

/**
 * Read the on-chain `FeeConfig` for one approved batch: derives the PDA per
 * `(distributor, root)`, fetches it, and decodes `feeMode` onto the chain-free
 * `BatchFeeConfig` union (raw lamports / 1e9-scale rate). Sunk from the console
 * `useBatchFeeSolana` leaf (S2) — the EVM arm's fee reads already live in
 * `@repo/airdrop-evm`, so this is the Solana half of that symmetry.
 *
 * `null` = the account is absent (the relay's `set-fee` never ran). Self-skips
 * (query returns `undefined`) until `distributor`/`root`/`rpc` are present, so
 * the inactive chain arm never reads.
 *
 * Unlike the `Infinity`-cached penalty/configurators reads, this keeps the
 * default staleTime: the fee CAN change (a re-run `set-fee`), and the Fee row is
 * refreshed via the explicit `airdropSolanaKeys.allFeeConfig()` invalidation
 * after a sync — matching the console leaf's original caching behavior byte-for-byte.
 */
export const solanaFeeConfigQueryOptions = (params: {
  chain: SolanaChain
  distributor: string | undefined
  root: `0x${string}` | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
}) => {
  const { chain, rpc, distributor, root } = params
  return queryOptions({
    queryKey: airdropSolanaKeys.feeConfig({ chain, distributor, root }),
    queryFn:
      rpc && distributor && root
        ? async (): Promise<SolanaFeeConfigData> => {
            const [pda] = await getFeeConfigPDA({
              distributor: distributor as Address,
              root: hexToBytes(root),
            })
            const account = await fetchFeeConfig(rpc, pda)
            if (account === null) return null
            const { feeMode } = account
            if (feeMode.__kind === "Fixed") {
              return { kind: "fixed", amount: feeMode.fields[0] }
            }
            return {
              kind: "single-tier",
              rate: feeMode.rate,
              minFee: feeMode.minFee,
              maxFee: feeMode.maxFee,
            }
          }
        : skipToken,
  })
}
