import { resolveChainKind } from "@repo/acs-client/model"
import { match } from "@repo/shared/utils"
import { confirmTx, type ConfirmTxParams } from "./confirm-tx"
import { useChainClients } from "./use-chain-clients"

/**
 * The single generic "confirm a tx on whatever chain" hook for hook-context
 * callers. Acquires the project's chain read clients via `useChainClients`
 * (mounted at the chainId/rpcUrl pinned at mount — a project is single-chain) and
 * returns an imperative `(txHash) => Promise<void>` that builds the
 * `chainKind`-discriminated `ConfirmTxParams` and awaits the chain-free
 * `confirmTx` facade. Wraps the boilerplate every flow otherwise re-plumbs
 * (client acquisition + per-chain confirm args). Carries no `wagmi`/`@solana/*`
 * imports — those live in the `use-chain-clients` leaves.
 */
export function useConfirmTx(params: {
  chainId: string | undefined
  rpcUrl?: string
}): (txHash: string) => Promise<void> {
  const { publicClient, solana } = useChainClients(params)

  return async (txHash: string): Promise<void> => {
    const kind = resolveChainKind(params.chainId)
    const confirmArgs = match<NonNullable<typeof kind> | "none", ConfirmTxParams>(kind ?? "none", {
      evm: (): ConfirmTxParams => ({
        chainKind: "evm",
        txHash,
        publicClient,
      }),
      solana: (): ConfirmTxParams => ({
        chainKind: "solana",
        txHash,
        rpc: solana?.rpc as NonNullable<typeof solana>["rpc"],
        rpcSubscriptions: solana?.rpcSubscriptions,
      }),
      none: () => {
        throw new Error(`useConfirmTx: unrecognised chainId "${params.chainId}"`)
      },
    })
    await confirmTx(confirmArgs)
  }
}
