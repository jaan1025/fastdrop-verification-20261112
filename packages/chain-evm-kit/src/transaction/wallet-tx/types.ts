import { type PublicClient } from "viem"
import { type ErrorAbis } from "../../errors/abis"

export type EvmWalletKind = "eoa" | "safe"

export type EvmTxHandle =
  | { kind: "eoa"; hash: `0x${string}` }
  | { kind: "safe"; safeTxHash: `0x${string}`; account: `0x${string}`; fromBlock: bigint }

export interface EvmConfirmContext {
  publicClient: PublicClient
  errorAbis?: ErrorAbis
}

export interface SafeExecutionResult {
  onChainHash: `0x${string}`
  success: boolean
}
