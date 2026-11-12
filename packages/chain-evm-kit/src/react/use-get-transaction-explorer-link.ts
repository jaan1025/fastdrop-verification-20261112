import { useCallback, useMemo } from "react"
import { useChains } from "wagmi"
import { getTransactionExplorerLink as _getTransactionExplorerLink } from "../transaction/explorer"

export const useGetTransactionExplorerLink = (options: { chainId: number }) => {
  const { chainId } = options

  const chains = useChains()
  const chain = useMemo(() => {
    return chains.find((chain) => chain.id === chainId)
  }, [chainId, chains])

  const getTransactionExplorerLink = useCallback(
    (txHash: string) => {
      if (!txHash || !chain) {
        return ""
      }
      return _getTransactionExplorerLink(txHash, chain)
    },
    [chain],
  )

  return {
    getTransactionExplorerLink,
  }
}
