// The generic EVM query-key registry. The kit owns only the chain-ecosystem
// slices: the `evm` root key and the ERC-20 token slice. The Clique contract
// families (distributor/lock/lockHook/penalty/cap) live in
// `@repo/airdrop-evm`'s own `airdropEvmKeys`.

/** ERC-20 query-key slice — composed into `evmKeys.erc20`. */
export const erc20Keys = {
  info: (params: { chainId: number; token: string | undefined }) =>
    ["evm", "erc20", "info", params] as const,
  symbol: (params: { chainId: number; token: string | undefined }) =>
    ["evm", "erc20", "symbol", params] as const,
  decimals: (params: { chainId: number; token: string | undefined }) =>
    ["evm", "erc20", "decimals", params] as const,
  name: (params: { chainId: number; token: string | undefined }) =>
    ["evm", "erc20", "name", params] as const,
  totalSupply: (params: { chainId: number; token: string | undefined }) =>
    ["evm", "erc20", "total-supply", params] as const,
  balance: (params: { chainId: number; token: string | undefined; account: string | undefined }) =>
    ["evm", "erc20", "balance", params] as const,
  allowance: (params: {
    chainId: number
    token: string | undefined
    owner: string | undefined
    spender: string | undefined
  }) => ["evm", "erc20", "allowance", params] as const,
}

export const evmKeys = {
  all: () => ["evm"] as const,
  erc20: erc20Keys,
}
