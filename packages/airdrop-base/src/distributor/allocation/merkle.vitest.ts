import { describe, expect, it } from "vitest"
import { deriveHandlerHash } from "./handler"
import { deriveSolanaHandlerHash } from "./handler-solana"
import { evmLeaf } from "./leaf-evm"
import { solanaLeaf } from "./leaf-solana"
import { foldRoot } from "./root"
import { computeMerkleLeaf, computeMerkleRoot, computeMerkleRootFromHandlerHash } from "./merkle"

const ADDR = "0x1111111111111111111111111111111111111111"
const HANDLER_HASH_ADDR = "0xe2c07404b8c1df4c46226425cac68c28d27a766bbddce62309f36724839b22c0"

describe("deriveHandlerHash [golden-test]", () => {
  it("hashes an EVM address as address-packed", () => {
    expect(deriveHandlerHash(ADDR)).toBe(HANDLER_HASH_ADDR)
  })
  it("hashes a non-address handler as string-packed", () => {
    expect(deriveHandlerHash("twitter:12345")).toBe(
      "0xe018545f916f0f89b52fee065c742962e400ca453bcfb1284f09b13105f23f5f",
    )
  })
  it("returns 0x for a missing handler", () => {
    expect(deriveHandlerHash()).toBe("0x")
  })
})

describe("evmLeaf [golden-test]", () => {
  it("keccak of bytes32 ‖ uint256(BE)", () => {
    expect(evmLeaf(HANDLER_HASH_ADDR, 1_000_000_000_000_000_000n)).toBe(
      "0x1d1547eb6b9664039fd8a97e60be2b657bea183ee1f5e7b498da09340607c806",
    )
  })
})

describe("solanaLeaf [golden-test]", () => {
  it("keccak of 40-byte handlerHash ‖ u64-LE amount", () => {
    expect(solanaLeaf(HANDLER_HASH_ADDR, 1_000_000n)).toBe(
      "0x4472b2ceccfb03f0b8ae4897f3d817618a867ead51cecfd69c4b10c25c4fc5e8",
    )
  })
})

describe("foldRoot [golden-test]", () => {
  const proof: `0x${string}`[] = [
    "0x2222222222222222222222222222222222222222222222222222222222222222",
    "0x0333333333333333333333333333333333333333333333333333333333333333",
  ]
  it("folds the sorted-pair into the root", () => {
    const leaf = evmLeaf(HANDLER_HASH_ADDR, 1_000_000_000_000_000_000n)
    expect(foldRoot(leaf, proof)).toBe(
      "0x96a40f94f0bcbe7608d907149d18bf42941411fe8a4366c5934045c4fa3d6843",
    )
  })
})

describe("merkle facade dispatch", () => {
  it("computeMerkleLeaf routes to the chain leaf", () => {
    expect(computeMerkleLeaf("evm", { handler: ADDR, amount: 1_000_000_000_000_000_000n })).toBe(
      evmLeaf(HANDLER_HASH_ADDR, 1_000_000_000_000_000_000n),
    )
    expect(computeMerkleLeaf("solana", { handler: ADDR, amount: 1_000_000n })).toBe(
      solanaLeaf(HANDLER_HASH_ADDR, 1_000_000n),
    )
  })

  it("computeMerkleRoot composes leaf + fold (matches legacy EVM getRoot)", () => {
    const proof: `0x${string}`[] = [
      "0x2222222222222222222222222222222222222222222222222222222222222222",
      "0x0333333333333333333333333333333333333333333333333333333333333333",
    ]
    expect(
      computeMerkleRoot("evm", {
        proof,
        handler: ADDR,
        amount: 1_000_000_000_000_000_000n,
      }),
    ).toBe("0x96a40f94f0bcbe7608d907149d18bf42941411fe8a4366c5934045c4fa3d6843")
  })
})

describe("ACS dynamic-recipient proofs", () => {
  const proof: `0x${string}`[] = [`0x${"aa".repeat(32)}`]
  const amount = 42n

  it("hashes the exact text of a checksummed EVM handler", () => {
    const handler = "0xabCDeF0123456789AbcdEf0123456789aBCDEF01"
    const handlerHash = deriveHandlerHash(handler, true)
    expect(handlerHash).toBe("0xec64e02e43b750b1ec2e8c90e663b68e847b3a076aeae1f864c335b162666885")
    expect(computeMerkleRootFromHandlerHash("evm", { proof, amount, handlerHash })).toBe(
      "0xe35954cff7fa041f1eaa6a519f2d7ce2f854fb146898a6c36a75dd65cd6e516e",
    )
    expect(computeMerkleRoot("evm", { proof, amount, handler })).toBe(
      "0xb9e16b2a975fda2e8c1fb1586004af126c3d60561405f89810d98ab6f141dec8",
    )
  })

  it("hashes a Solana public key as text in dynamic mode and as bytes in static mode", () => {
    const handler = "So11111111111111111111111111111111111111112"
    const handlerHash = deriveSolanaHandlerHash(handler, true)
    expect(handlerHash).toBe("0xe246c49d3cda5b8a46d7075e667e1b0b4ed4e51f3adf72560e09f65b6b8dc949")
    expect(computeMerkleRootFromHandlerHash("solana", { proof, amount, handlerHash })).toBe(
      "0xa6ad8437d597a0bb7cdef87cc61beb9f5c91c7489b1c8c500cdbab9574e8f12c",
    )
    expect(computeMerkleRoot("solana", { proof, amount, handler })).toBe(
      "0x47c228d5e393d9dc660e905e31e36101d7ad8149a764f8b7b32790d43cdc9ad4",
    )
  })
})
