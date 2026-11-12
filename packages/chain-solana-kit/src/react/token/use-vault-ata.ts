"use client"
import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import type { SolanaChain } from "../../config/network"
import {
  solanaVaultAtaQueryOptions,
  type VaultAtaData,
  type VaultAtaQueryKey,
} from "../../query/token/vault-ata"

export type UseVaultAtaParameters<TData = VaultAtaData> = {
  owner: Address | undefined
  mint: Address | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
  chain: SolanaChain
} & QueryParameter<VaultAtaData, Error, TData, VaultAtaQueryKey>

export const useVaultAta = <TData = VaultAtaData>(parameters: UseVaultAtaParameters<TData>) => {
  const { query, owner, mint, rpc, chain } = parameters
  return useQuery({
    ...solanaVaultAtaQueryOptions({ chain, owner, mint, rpc }),
    ...query,
  })
}
