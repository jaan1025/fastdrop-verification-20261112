import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { queryOptions, skipToken, type UseQueryOptions } from "@tanstack/react-query"
import type { SolanaChain } from "../../config/network"
import { solanaKeys } from "../keys"

export type AccountTransactionsData = string[]
export type AccountTransactionsQueryKey = ReturnType<typeof solanaKeys.accountTransactions>

export const solanaAccountTransactionsQueryOptions = (params: {
  chain: SolanaChain
  address: Address | undefined
  limit?: number
  rpc: Rpc<SolanaRpcApi> | undefined
}) => {
  const { chain, address, limit = 5, rpc } = params
  return queryOptions({
    queryKey: solanaKeys.accountTransactions({ chain, address, limit }),
    queryFn:
      rpc && address
        ? async (): Promise<AccountTransactionsData> => {
            const signatures = await rpc.getSignaturesForAddress(address, { limit }).send()
            return signatures.filter((s) => !s.err).map((s) => s.signature as string)
          }
        : skipToken,
  }) satisfies UseQueryOptions<
    AccountTransactionsData,
    Error,
    AccountTransactionsData,
    AccountTransactionsQueryKey
  >
}
