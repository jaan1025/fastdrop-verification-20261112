import { useCallback, useMemo } from "react"
import type { SolanaChain } from "../config/registry"
import {
  getAddressExplorerLink as buildAddressLink,
  type SolanaExplorerOptions,
} from "../transaction/explorer"

/**
 * Explorer URL for an account address. Pass `cluster` explicitly, or `chain` +
 * `endpoint` for detection. Sibling of `useGetTransactionExplorerLink`; delegates
 * to the pure `getAddressExplorerLink` builder and only memoizes the inputs.
 */
export const useGetAddressExplorerLink = (options: {
  cluster?: string
  chain?: SolanaChain
  endpoint?: string
}) => {
  const { cluster, chain, endpoint } = options

  const explorerOptions = useMemo<SolanaExplorerOptions>(
    () => ({ cluster, chain, endpoint }),
    [chain, cluster, endpoint],
  )

  const getAddressExplorerLink = useCallback(
    (address: string) => buildAddressLink(address, explorerOptions),
    [explorerOptions],
  )

  return { getAddressExplorerLink }
}
