import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import { getDynamicRecipient } from "../../contracts/distributor/functions"
import { airdropEvmKeys } from "../keys"

type DistributorInputs = { distributor: Address | undefined }

export type EvmDynamicRecipientData = Awaited<ReturnType<typeof getDynamicRecipient>>
export type EvmDynamicRecipientQueryKey = ReturnType<typeof airdropEvmKeys.dynamicRecipient>

export const evmDynamicRecipientQueryOptions = (
  params: DistributorInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, distributor, publicClient } = params
  return queryOptions({
    queryKey: airdropEvmKeys.dynamicRecipient({ chainId, distributor }),
    queryFn:
      publicClient && distributor
        ? () => getDynamicRecipient(publicClient, { distributor })
        : skipToken,
  })
}

export type UseDynamicRecipientParameters = DistributorInputs & {
  chainId: number
} & QueryParameter<
    EvmDynamicRecipientData,
    Error,
    EvmDynamicRecipientData,
    EvmDynamicRecipientQueryKey
  >
