import { queryOptions, skipToken } from "@tanstack/react-query"
import { type Address, type PublicClient } from "viem"
import { type QueryParameter } from "@repo/acs-client/react"
import { getVault } from "../../contracts/distributor/functions"
import { airdropEvmKeys } from "../keys"

type DistributorInputs = { distributor: Address | undefined }

export type EvmVaultData = Awaited<ReturnType<typeof getVault>>
export type EvmVaultQueryKey = ReturnType<typeof airdropEvmKeys.vault>

export const evmVaultQueryOptions = (
  params: DistributorInputs & {
    chainId: number
    publicClient: PublicClient | undefined
  },
) => {
  const { chainId, distributor, publicClient } = params
  return queryOptions({
    queryKey: airdropEvmKeys.vault({ chainId, distributor }),
    queryFn:
      publicClient && distributor ? () => getVault(publicClient, { distributor }) : skipToken,
  })
}

export type UseVaultParameters = DistributorInputs & { chainId: number } & QueryParameter<
    EvmVaultData,
    Error,
    EvmVaultData,
    EvmVaultQueryKey
  >
