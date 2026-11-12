import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { queryOptions, skipToken } from "@tanstack/react-query"
import type { SolanaChain } from "@repo/chain-solana-kit/config"
import { getStreamPresetPDA } from "../../contracts/distributor/functions/pda"
import { fetchStreamPreset } from "../../contracts/distributor/functions/fetch"
import type { StreamPreset } from "../../contracts/distributor/generated/accounts/streamPreset"
import { bytesToHex } from "@repo/shared/utils"
import { airdropSolanaKeys } from "../keys"

export interface SolanaStreamPresetQueryResult {
  preset: StreamPreset
  pda: Address
}

export type SolanaStreamPresetData = SolanaStreamPresetQueryResult | null
export type SolanaStreamPresetQueryKey = ReturnType<typeof airdropSolanaKeys.streamPreset>

export const solanaStreamPresetQueryOptions = (params: {
  chain: SolanaChain
  distributor: Address | undefined
  configurator: Uint8Array | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
}) => {
  const { chain, rpc, distributor, configurator } = params
  return queryOptions({
    queryKey: airdropSolanaKeys.streamPreset({
      chain,
      distributor,
      configurator: configurator ? bytesToHex(configurator) : undefined,
    }),
    queryFn:
      rpc && distributor && configurator
        ? async (): Promise<SolanaStreamPresetData> => {
            const [pda] = await getStreamPresetPDA({
              distributor,
              configurator,
            })
            const preset = await fetchStreamPreset(rpc, pda)
            if (!preset) return null
            return { preset, pda }
          }
        : skipToken,
  })
}
