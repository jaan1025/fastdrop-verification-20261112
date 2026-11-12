import { type PublicClient } from "viem"
import { type EvmWalletKind } from "./types"
import { isSafeAccount } from "./safe"

/**
 * Classify the connected EVM account into a wallet-strategy kind. Composes the
 * Safe-specific probe in `safe/primitives/detect.ts`; the `send` dispatcher
 * switches exhaustively on the returned kind.
 */
export const detectEvmWalletKind = async (
  account: `0x${string}`,
  publicClient: PublicClient,
): Promise<EvmWalletKind> => ((await isSafeAccount(account, publicClient)) ? "safe" : "eoa")
