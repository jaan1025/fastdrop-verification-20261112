import { type PublicClient } from "viem"
import { assertNever } from "@repo/shared/utils"
import { type ErrorAbis } from "../../errors/abis"
import { type EvmTxHandle } from "./types"
import { detectEvmWalletKind } from "./detect"
import { eoaSend } from "./eoa"
import { safeSend } from "./safe"

/**
 * Detects the wallet kind for `account`, then broadcasts the transaction
 * via the appropriate strategy and returns a discriminated handle.
 *
 * The `write` closure is responsible for simulation + calldata building
 * (e.g. `simulateContract` + `writeContract`). The handle carries enough
 * state for `confirmTransaction` to resolve finality without any extra args.
 *
 * Exhaustive: adding a new `EvmWalletKind` is a compile error here.
 */
export const sendTransaction = async (params: {
  write: () => Promise<`0x${string}`>
  account: `0x${string}`
  publicClient: PublicClient
  errorAbis?: ErrorAbis
}): Promise<EvmTxHandle> => {
  const { write, account, publicClient, errorAbis } = params
  const kind = await detectEvmWalletKind(account, publicClient)

  switch (kind) {
    case "eoa":
      return eoaSend(write, errorAbis)
    case "safe":
      return safeSend(write, account, publicClient, errorAbis)
    default:
      return assertNever(kind)
  }
}
