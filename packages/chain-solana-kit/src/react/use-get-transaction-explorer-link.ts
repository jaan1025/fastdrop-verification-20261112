import { useCallback, useMemo } from "react"
import type { SolanaChain } from "../config/registry"
import {
  getTransactionExplorerLink as buildExplorerLink,
  type SolanaExplorerOptions,
} from "../transaction/explorer"

/**
 * Explorer URL for a tx signature. Pass `cluster` explicitly, or `chain` +
 * `endpoint` for detection. Delegates the cluster detection + URL construction to
 * the pure `getTransactionExplorerLink` builder (`../transaction/explorer`); this hook
 * only memoizes the detection inputs and the returned callback.
 */
export const useGetTransactionExplorerLink = (options: {
  cluster?: string
  chain?: SolanaChain
  endpoint?: string
}) => {
  const { cluster, chain, endpoint } = options

  const explorerOptions = useMemo<SolanaExplorerOptions>(
    () => ({ cluster, chain, endpoint }),
    [chain, cluster, endpoint],
  )

  const getTransactionExplorerLink = useCallback(
    (txSignature: string) => buildExplorerLink(txSignature, explorerOptions),
    [explorerOptions],
  )

  return { getTransactionExplorerLink }
}
