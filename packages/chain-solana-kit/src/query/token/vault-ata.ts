import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { skipToken, type UseQueryOptions } from "@tanstack/react-query"
import type { SolanaChain } from "../../config/network"
import { solanaKeys } from "../keys"
import { deriveAta, getMintTokenProgram } from "../../token/ata"

export type VaultAtaData = Address
export type VaultAtaQueryKey = ReturnType<typeof solanaKeys.vaultAta>

export const solanaVaultAtaQueryOptions = (params: {
  chain: SolanaChain
  rpc: Rpc<SolanaRpcApi> | undefined
  owner: Address | undefined
  mint: Address | undefined
}) => {
  const { chain, rpc, owner, mint } = params
  return {
    queryKey: solanaKeys.vaultAta({ chain, owner, mint }),
    queryFn:
      rpc && owner && mint
        ? async (): Promise<VaultAtaData> => {
            const tokenProgram = await getMintTokenProgram(rpc, mint)
            return deriveAta(owner, mint, tokenProgram)
          }
        : skipToken,
    staleTime: Infinity,
  } satisfies UseQueryOptions<VaultAtaData, Error, VaultAtaData, VaultAtaQueryKey>
}
