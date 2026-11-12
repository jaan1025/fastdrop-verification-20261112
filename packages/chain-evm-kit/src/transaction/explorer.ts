import type { Chain } from "viem"

/** Pure block-explorer tx-link builder; co-located with the explorer hook seam. */
export const getTransactionExplorerLink = (txHash: string, chain: Chain): string => {
  if (!chain?.blockExplorers?.default.url) {
    return ""
  }
  return `${chain.blockExplorers.default.url}/tx/${txHash}`
}
