import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { queryOptions, skipToken } from "@tanstack/react-query"
import {
  fetchMaybeToken as fetchMaybeTokenLegacy,
  type Token as LegacyToken,
} from "@solana-program/token"
import {
  fetchMaybeToken as fetchMaybeTokenLatest,
  TOKEN_2022_PROGRAM_ADDRESS,
  type Token as LatestToken,
} from "@solana-program/token-2022"
import type { SolanaChain } from "../../config/network"
import { solanaKeys } from "../keys"

export type TokenAccountInfo = LegacyToken | LatestToken
export type TokenAccountData = TokenAccountInfo | null
export type TokenAccountQueryKey = ReturnType<typeof solanaKeys.tokenAccount>

const fetchTokenAccount = async (
  rpc: Rpc<SolanaRpcApi>,
  tokenAccount: Address,
): Promise<TokenAccountInfo | null> => {
  const accountInfo = await rpc
    .getAccountInfo(tokenAccount, { commitment: "confirmed", encoding: "base64" })
    .send()
  if (!accountInfo?.value?.owner) return null
  const fetchFn =
    accountInfo.value.owner === TOKEN_2022_PROGRAM_ADDRESS
      ? fetchMaybeTokenLatest
      : fetchMaybeTokenLegacy
  const account = await fetchFn(rpc, tokenAccount)
  return account.exists ? (account.data as TokenAccountInfo) : null
}

export const solanaTokenAccountQueryOptions = (params: {
  chain: SolanaChain
  tokenAccount: Address | undefined
  rpc: Rpc<SolanaRpcApi> | undefined
}) => {
  const { chain, rpc, tokenAccount } = params
  return queryOptions({
    queryKey: solanaKeys.tokenAccount({ chain, tokenAccount }),
    queryFn: rpc && tokenAccount ? () => fetchTokenAccount(rpc, tokenAccount) : skipToken,
  })
}
