import { computeMerkleRootFromHandlerHash, deriveHandlerHash, deriveSolanaHandlerHash } from "@repo/airdrop-base/distributor"
import type { ChainKind } from "@repo/acs-client/model"

export function selectedBatch(batches: readonly string[] | undefined, explicit?: string) {
  return explicit || batches?.at(-1)
}

export function allocationRoot(input: {
  chainKind: ChainKind | undefined
  allocation: string | undefined
  addressHandler: string | undefined
  proof: readonly `0x${string}`[] | undefined
  dynamicRecipient: boolean
}): `0x${string}` | undefined {
  if (!input.chainKind || !input.allocation || !input.addressHandler || !input.proof) return undefined
  const amount = BigInt(input.allocation)
  if (amount <= 0n) return undefined
  if (input.proof.some((hash) => !/^0x[0-9a-f]{64}$/i.test(hash))) throw new Error("Invalid allocation proof.")
  const handlerHash = input.chainKind === "evm"
    ? deriveHandlerHash(input.addressHandler, input.dynamicRecipient)
    : deriveSolanaHandlerHash(input.addressHandler, input.dynamicRecipient)
  return computeMerkleRootFromHandlerHash(input.chainKind, { amount, proof: [...input.proof], handlerHash })
}
