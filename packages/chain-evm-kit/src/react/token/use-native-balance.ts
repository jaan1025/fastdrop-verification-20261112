"use client"
import { useMemo } from "react"
import { useBalance, type UseBalanceParameters } from "wagmi"

export interface EvmNativeBalance {
  /** Wei. */
  value: bigint
  /** Native token symbol (e.g. "ETH", "MATIC", "BNB"). */
  symbol: string
  /** Native token decimals — typically 18 on EVM. */
  decimals: number
}

export type UseNativeBalanceParameters = UseBalanceParameters

/**
 * Native gas balance for an EVM wallet. Wraps wagmi's `useBalance` and
 * projects the result to a slim, Solana-symmetric `{ value, symbol, decimals }`
 * shape — exported here so the relayer-balance hook and the fund-deployer
 * modal go through `@repo/chain-evm-kit` instead of importing wagmi directly.
 * Paired with `useNativeBalance` in `@repo/chain-solana-kit`.
 *
 * No baked-in `refetchInterval` — callers opt in via
 * `query: { refetchInterval: 30_000 }`. Matches the Solana counterpart.
 *
 * Power consumers that need wagmi-native extras (`.data.formatted`,
 * `.data.chain`) should import `useBalance` from `wagmi` directly.
 */
export const useNativeBalance = (parameters: UseNativeBalanceParameters = {}) => {
  const result = useBalance(parameters)
  const data = useMemo<EvmNativeBalance | undefined>(
    () =>
      result.data && {
        value: result.data.value,
        symbol: result.data.symbol,
        decimals: result.data.decimals,
      },
    [result.data],
  )
  return { ...result, data }
}
