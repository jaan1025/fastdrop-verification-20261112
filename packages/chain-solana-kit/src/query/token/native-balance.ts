import { type Address, type Commitment, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { skipToken, type UseQueryOptions } from "@tanstack/react-query"
import type { SolanaChain } from "../../config/network"
import { solanaKeys } from "../keys"

export interface NativeBalance {
  /** Balance in lamports. 1 SOL = 1_000_000_000 lamports. */
  lamports: bigint
}

export type NativeBalanceData = NativeBalance
export type NativeBalanceQueryKey = ReturnType<typeof solanaKeys.nativeBalance>

export const solanaNativeBalanceQueryOptions = (params: {
  chain: SolanaChain
  rpc: Rpc<SolanaRpcApi> | undefined
  address: Address | undefined
  /** Read commitment. Omit (RPC default `confirmed`) for live displays; pass
   *  `finalized` for the deploy gate so it only greenlights once the deployer's
   *  funding has finalized — matching the backend deploy's finalized preflight. */
  commitment?: Commitment
}) => {
  const { chain, rpc, address, commitment } = params
  return {
    queryKey: solanaKeys.nativeBalance({ chain, address, commitment }),
    queryFn:
      rpc && address
        ? async (): Promise<NativeBalance> => {
            const result = await rpc.getBalance(address, commitment ? { commitment } : {}).send()
            return { lamports: BigInt(result.value) }
          }
        : skipToken,
  } satisfies UseQueryOptions<NativeBalance, Error, NativeBalance, NativeBalanceQueryKey>
}
