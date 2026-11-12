import { expect, it, vi } from "vitest"
import { address } from "@solana/kit"
import { bytesToHex, hexToBytes } from "@repo/shared/utils"
import { HookType } from "../generated/types/hookType"
import { fetchBatchConfig, fetchClaimRoot, fetchPenaltyConfig } from "./fetch"
import { getDistributorPDA } from "./pda"
import { prepareSolanaClaimExtra } from "./prepare-claim-extra"

vi.mock("./fetch", () => ({
  fetchBatchConfig: vi.fn(),
  fetchClaimRoot: vi.fn(),
  fetchPenaltyConfig: vi.fn(),
}))

it("encodes the partial claim delta and penalty remainder without changing the leaf root", async () => {
  const base = address("So11111111111111111111111111111111111111112")
  const configurator = Array<number>(32).fill(7)
  const root = "0x469ade5aa6a8c479ff83869a07575e25436e81aac9e57fcecfb22c82654488a1"
  const [distributor] = await getDistributorPDA(base)
  vi.mocked(fetchClaimRoot).mockResolvedValue({
    discriminator: new Uint8Array(8),
    distributor,
    root: Array.from(hexToBytes(root)),
    configurators: [configurator],
  })
  vi.mocked(fetchBatchConfig).mockResolvedValue({
    discriminator: new Uint8Array(8),
    strategies: [
      { hookType: HookType.Penalty, proportion: 1_000_000_000n, accountsCount: 1 },
      { hookType: HookType.Transfer, proportion: 0n, accountsCount: 0 },
    ],
    fallbackHook: 1,
    bump: 255,
  })
  vi.mocked(fetchPenaltyConfig).mockResolvedValue({
    discriminator: new Uint8Array(8),
    distributor,
    configurator,
    beginTime: 1_699_999_900n,
    endTime: 1_700_000_100n,
    startPenalty: 700_000_000n,
    endPenalty: 300_000_000n,
    bump: 255,
  })
  const input = {
    rpc: {} as never,
    base,
    addressHandler: "0x1111111111111111111111111111111111111111",
    proof: [
      "0x2222222222222222222222222222222222222222222222222222222222222222",
      "0x0333333333333333333333333333333333333333333333333333333333333333",
    ] as `0x${string}`[],
    amount: 1_000_000n,
    claimAt: 1_700_000_000n,
  }
  const full = await prepareSolanaClaimExtra(input)
  const partial = await prepareSolanaClaimExtra({ ...input, claimable: 400_001n })

  expect(bytesToHex(partial.rootBytes)).toBe(root)
  expect(partial.rootBytes).toEqual(full.rootBytes)
  expect(partial.claimRootPda).toBe(full.claimRootPda)
  expect(partial.batchConfigPda).toBe(full.batchConfigPda)
  // Borsh: index 0, [Penalty(1_000_000, claimAt), Transfer(500_000)].
  expect(full.extraHex).toBe(
    "0x00020000001000000040420f000000000000f15365000000000800000020a1070000000000",
  )
  // The 50% penalty consumes 200_000 of the 400_001 share; Transfer gets 200_001.
  expect(partial.extraHex).toBe(
    "0x000200000010000000811a06000000000000f153650000000008000000410d030000000000",
  )
})
