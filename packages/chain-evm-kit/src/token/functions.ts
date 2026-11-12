import {
  type Address,
  erc20Abi as abi,
  type PublicClient,
  type WalletClient,
  type Hash,
} from "viem"

export const getSymbol = (
  publicClient: PublicClient,
  params: { token: Address },
): Promise<string> =>
  publicClient.readContract({
    address: params.token,
    abi,
    functionName: "symbol",
  })

export const getDecimals = (
  publicClient: PublicClient,
  params: { token: Address },
): Promise<number> =>
  publicClient.readContract({
    address: params.token,
    abi,
    functionName: "decimals",
  })

export const getName = (publicClient: PublicClient, params: { token: Address }): Promise<string> =>
  publicClient.readContract({
    address: params.token,
    abi,
    functionName: "name",
  })

export const getTotalSupply = (
  publicClient: PublicClient,
  params: { token: Address },
): Promise<bigint> =>
  publicClient.readContract({
    address: params.token,
    abi,
    functionName: "totalSupply",
  })

export const getBalance = (
  publicClient: PublicClient,
  params: { token: Address; account: Address },
): Promise<bigint> =>
  publicClient.readContract({
    address: params.token,
    abi,
    functionName: "balanceOf",
    args: [params.account],
  })

export const getAllowance = (
  publicClient: PublicClient,
  params: { token: Address; owner: Address; spender: Address },
): Promise<bigint> =>
  publicClient.readContract({
    address: params.token,
    abi,
    functionName: "allowance",
    args: [params.owner, params.spender],
  })

export interface TokenInfo {
  symbol: string
  decimals: number
  name: string
  totalSupply: bigint
}

export const getTokenInfo = async (
  publicClient: PublicClient,
  params: { token: Address },
): Promise<TokenInfo> => {
  const { token } = params
  const [symbol, decimals, name, totalSupply] = await Promise.all([
    getSymbol(publicClient, { token }),
    getDecimals(publicClient, { token }),
    getName(publicClient, { token }),
    getTotalSupply(publicClient, { token }),
  ])
  return { symbol, decimals, name, totalSupply }
}

export const transfer = async (
  publicClient: PublicClient,
  walletClient: WalletClient,
  params: { token: Address; to: Address; amount: bigint },
): Promise<Hash> => {
  const { token, to, amount } = params
  const { request } = await publicClient.simulateContract({
    address: token,
    abi,
    functionName: "transfer",
    args: [to, amount],
    account: walletClient.account!,
  })
  return await walletClient.writeContract(request)
}

export const approve = async (
  publicClient: PublicClient,
  walletClient: WalletClient,
  params: { token: Address; spender: Address; amount: bigint },
): Promise<Hash> => {
  const { token, spender, amount } = params
  const { request } = await publicClient.simulateContract({
    address: token,
    abi,
    functionName: "approve",
    args: [spender, amount],
    account: walletClient.account!,
  })
  return await walletClient.writeContract(request)
}
