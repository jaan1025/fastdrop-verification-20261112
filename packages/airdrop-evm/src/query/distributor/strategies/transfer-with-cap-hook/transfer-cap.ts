import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type Hash, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import { getCap } from "../../../../contracts/distributor/strategies/transfer-with-cap-hook/functions"
import { airdropEvmKeys } from "../../../keys"

type TransferCapInputs = {
  transferWithCapHook: Address | undefined
  distributor: Address | undefined
  configurationId: Hash | undefined
}

export type EvmTransferCapData = Awaited<ReturnType<typeof getCap>>
export type EvmTransferCapQueryKey = ReturnType<typeof airdropEvmKeys.transferCap>

export const evmTransferCapQueryOptions = (
  params: TransferCapInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, transferWithCapHook, distributor, configurationId, publicClient } = params
  return queryOptions({
    queryKey: airdropEvmKeys.transferCap({
      chainId,
      transferWithCapHook,
      distributor,
      configurationId,
    }),
    queryFn:
      publicClient && transferWithCapHook && distributor && configurationId
        ? () =>
            getCap(publicClient, {
              transferWithCapHook,
              distributor,
              configurationId,
            })
        : skipToken,
  })
}

export type UseTransferCapParameters = TransferCapInputs & {
  chainId: number
} & QueryParameter<EvmTransferCapData, Error, EvmTransferCapData, EvmTransferCapQueryKey>
