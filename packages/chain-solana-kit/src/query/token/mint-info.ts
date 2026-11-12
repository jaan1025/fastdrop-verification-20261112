import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { queryOptions, skipToken } from "@tanstack/react-query"
import { fetchMaybeMint as fetchMaybeMintToken } from "@solana-program/token"
import {
  fetchMaybeMint as fetchMaybeMintToken2022,
  TOKEN_2022_PROGRAM_ADDRESS,
} from "@solana-program/token-2022"
import type { SolanaChain } from "../../config/network"
import { getMintTokenProgram } from "../../token/ata"
import { type MintInfo } from "../../token/mint"
import { solanaKeys } from "../keys"

export type { MintInfo }
export type MintInfoData = MintInfo | null
export type MintInfoQueryKey = ReturnType<typeof solanaKeys.mintInfo>

const fetchMintInfo = async (rpc: Rpc<SolanaRpcApi>, mint: Address): Promise<MintInfoData> => {
  const program = await getMintTokenProgram(rpc, mint)
  const fetchFn =
    program === TOKEN_2022_PROGRAM_ADDRESS ? fetchMaybeMintToken2022 : fetchMaybeMintToken
  const account = await fetchFn(rpc, mint)
  return account.exists ? (account.data as MintInfo) : null
}

export const solanaMintInfoQueryOptions = (params: {
  chain: SolanaChain
  mint: Address | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
}) => {
  const { chain, rpc, mint } = params
  return queryOptions({
    queryKey: solanaKeys.mintInfo({ chain, mint }),
    queryFn: rpc && mint ? () => fetchMintInfo(rpc, mint) : skipToken,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
