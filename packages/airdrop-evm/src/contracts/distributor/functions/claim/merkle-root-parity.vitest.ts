import { describe, expect, it, vi } from "vitest"
import { encodePacked, keccak256, type Hash, type PublicClient, type WalletClient } from "viem"
import { compareBytes32 } from "@repo/shared/utils"
import { computeMerkleRoot, deriveHandlerHash } from "@repo/airdrop-base/distributor"
import { claim } from "./claim"

/**
 * BEHAVIOR-PARITY: the on-chain root recompute inside the EVM `claim` function.
 *
 * LEGACY `main:.../distributor/functions/index.ts::claim` computed the root as
 *   getRoot(proof, handlerHash, amount)   // handlerHash already keccaked
 * where getRoot (main:.../utils/merkle.ts) seeds the leaf from its 2nd arg
 * DIRECTLY: keccak256(encodePacked(['bytes32','uint256'], [handlerHash, amount])).
 *
 * NEW `.../distributor/functions/index.ts::claim` computes the root as
 *   computeMerkleRoot('evm', { proof, handler, amount })   // RAW handler string
 * which derives the handler hash INTERNALLY (deriveHandlerHash) before seeding the
 * leaf. The two are byte-identical ONLY because the caller passes the raw handler
 * whose derived hash equals the legacy handlerHash. This test pins that equality
 * (the fee/sig-verification root must be unchanged).
 */

// Verbatim re-implementation of the legacy getRoot (main:.../utils/merkle.ts).
const legacyGetRoot = (proof: `0x${string}`[], handlerHash: Hash, amount: bigint): Hash =>
  proof.reduce(
    (acc, p) =>
      keccak256(
        encodePacked(
          ["bytes32", "bytes32"],
          [acc, p].sort(compareBytes32) as [`0x${string}`, `0x${string}`],
        ),
      ),
    keccak256(encodePacked(["bytes32", "uint256"], [handlerHash, amount])),
  )

// Verbatim re-implementation of the legacy getHandlerHash (main:.../utils/hash.ts).
const legacyGetHandlerHash = (handler?: string): Hash => {
  if (!handler) return "0x" as Hash
  // isAddress branch: a 20-byte hex address packs as 'address'.
  const isAddr = /^0x[0-9a-fA-F]{40}$/.test(handler)
  return isAddr
    ? keccak256(encodePacked(["address"], [handler as `0x${string}`]))
    : keccak256(encodePacked(["string"], [handler]))
}

const ADDR = "0x1111111111111111111111111111111111111111"
const PROOF: `0x${string}`[] = [`0x${"aa".repeat(32)}`, `0x${"02".repeat(32)}`]

describe("EVM claim root — new computeMerkleRoot matches legacy getRoot(getHandlerHash(...))", () => {
  it("handler hash derivation matches the legacy getHandlerHash for an address", () => {
    expect(deriveHandlerHash(ADDR)).toBe(legacyGetHandlerHash(ADDR))
  })

  it("handler hash derivation matches for a non-address identifier", () => {
    expect(deriveHandlerHash("twitter:42")).toBe(legacyGetHandlerHash("twitter:42"))
  })

  it("root (empty proof / leaf only) matches the legacy fold", () => {
    const amount = 1000n
    const newRoot = computeMerkleRoot("evm", { proof: [], handler: ADDR, amount })
    const oldRoot = legacyGetRoot([], legacyGetHandlerHash(ADDR), amount)
    expect(newRoot).toBe(oldRoot)
  })

  it("root (with proof) matches the legacy fold", () => {
    const amount = 123456789n
    const newRoot = computeMerkleRoot("evm", { proof: PROOF, handler: ADDR, amount })
    const oldRoot = legacyGetRoot(PROOF, legacyGetHandlerHash(ADDR), amount)
    expect(newRoot).toBe(oldRoot)
  })

  it("root matches for a non-address (string) handler", () => {
    const amount = 7n
    const handler = "discord:9001"
    const newRoot = computeMerkleRoot("evm", { proof: PROOF, handler, amount })
    const oldRoot = legacyGetRoot(PROOF, legacyGetHandlerHash(handler), amount)
    expect(newRoot).toBe(oldRoot)
  })
})

it("uses the reviewed dynamic root and handler hash for the ledger, fee, and claim calldata", async () => {
  const handler = "0xabCDeF0123456789AbcdEf0123456789aBCDEF01"
  const handlerHash = "0xec64e02e43b750b1ec2e8c90e663b68e847b3a076aeae1f864c335b162666885"
  const root = "0xe35954cff7fa041f1eaa6a519f2d7ce2f854fb146898a6c36a75dd65cd6e516e"
  const proof: Hash[] = [`0x${"aa".repeat(32)}`]
  const readContract = vi.fn(async ({ functionName }: { functionName: string }) => {
    if (functionName === "claimed") return [0n, 0n]
    if (functionName === "requiredFee") return 8n
    throw new Error("No Safe interface")
  })
  const simulateContract = vi.fn().mockResolvedValue({ request: {} })
  const writeContract = vi.fn().mockResolvedValue("0x1234")
  const client = { readContract, simulateContract } as unknown as PublicClient
  const wallet = { account: { address: ADDR }, writeContract } as unknown as WalletClient
  await claim(client, wallet, {
    distributor: ADDR,
    proof,
    signature: "0x5678",
    amount: 42n,
    released: 42n,
    onBehalfOf: ADDR,
    handlerHash,
    handler,
    root,
  })
  expect(readContract).toHaveBeenCalledWith(
    expect.objectContaining({
      functionName: "claimed",
      args: [root, handlerHash],
    }),
  )
  expect(readContract).toHaveBeenCalledWith(
    expect.objectContaining({
      functionName: "requiredFee",
      args: [root, 42n],
    }),
  )
  expect(simulateContract).toHaveBeenCalledWith(
    expect.objectContaining({
      functionName: "claim",
      args: [proof, "0x5678", 42n, 42n, handlerHash, ADDR, "0x"],
      value: 8n,
    }),
  )
})
