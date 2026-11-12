import { afterEach, describe, expect, it, vi } from "vitest"
import { type Address } from "@solana/kit"
import { skipToken } from "@tanstack/react-query"
import { bytesToHex } from "@repo/shared/utils"
import { solanaConsumptionQueryOptions } from "./consumption"

// CHARACTERIZATION (tests only) — pins the pure shaping of the consumption
// queryFn: the `claimed === 0n → null` guard, the wire `claimed` → `consumed`
// re-naming (the account field records CONSUMPTION, not wallet receipt), and
// the `lastSlot` passthrough. Mocked at the contracts-fns seam
// (`getClaimStatus` returns a canned status); the PDA derivations are stubbed.

const PDA = "So11111111111111111111111111111111111111112" as Address

// `vi.mock` factories are hoisted above module-scope consts, so the PDA literal
// is inlined inside them (referencing the outer `PDA` would throw TDZ).
vi.mock("../../contracts/distributor/functions", () => ({
  getDistributorPDA: vi.fn().mockResolvedValue(["So11111111111111111111111111111111111111112"]),
  getClaimRootPDA: vi.fn().mockResolvedValue(["So11111111111111111111111111111111111111112"]),
  getClaimStatus: vi.fn(),
}))
const { getClaimStatus } = await import("../../contracts/distributor/functions")
const mockClaimStatus = vi.mocked(getClaimStatus)

const CHAIN = "devnet" as never
const params = {
  chain: CHAIN,
  appId: "app",
  deployment: "dep",
  batch: "batch",
  base: PDA,
  root: "0x1234" as `0x${string}`,
  handler: PDA,
  rpc: {} as never,
}

const callQueryFn = (): Promise<unknown> => {
  const { queryFn } = solanaConsumptionQueryOptions(params)
  if (queryFn === skipToken) throw new Error("expected a queryFn, got skipToken")
  return (queryFn as () => Promise<unknown>)()
}

describe("solanaConsumptionQueryOptions — queryFn [characterization]", () => {
  afterEach(() => vi.clearAllMocks())

  it("skipToken when rpc / base / root / handler missing", () => {
    expect(solanaConsumptionQueryOptions({ ...params, rpc: undefined }).queryFn).toBe(skipToken)
    expect(solanaConsumptionQueryOptions({ ...params, base: undefined }).queryFn).toBe(skipToken)
    expect(solanaConsumptionQueryOptions({ ...params, root: undefined }).queryFn).toBe(skipToken)
    expect(solanaConsumptionQueryOptions({ ...params, handler: undefined }).queryFn).toBe(skipToken)
  })

  it("null when claim status is missing", async () => {
    mockClaimStatus.mockResolvedValue(null as never)
    await expect(callQueryFn()).resolves.toBeNull()
  })

  it("null when claimed === 0n", async () => {
    mockClaimStatus.mockResolvedValue({ claimed: 0n, lastSlot: 99n } as never)
    await expect(callQueryFn()).resolves.toBeNull()
  })

  it("renames the wire claimed → consumed and passes lastSlot through", async () => {
    mockClaimStatus.mockResolvedValue({
      claimed: 500n,
      lastSlot: 12345n,
    } as never)
    await expect(callQueryFn()).resolves.toEqual({
      consumed: 500n,
      lastSlot: 12345n,
    })
  })

  it("reads a prior dynamic claim by the raw handler hash and a distinct cache key", async () => {
    mockClaimStatus.mockResolvedValue({ claimed: 500n, lastSlot: 12345n } as never)
    const options = solanaConsumptionQueryOptions({ ...params, dynamicRecipient: true })
    expect(options.queryKey).not.toEqual(solanaConsumptionQueryOptions(params).queryKey)
    expect(options.queryFn).not.toBe(skipToken)
    await expect((options.queryFn as () => Promise<unknown>)()).resolves.toMatchObject({
      consumed: 500n,
    })
    expect(bytesToHex(mockClaimStatus.mock.calls[0]![1].handler)).toBe(
      "0xe246c49d3cda5b8a46d7075e667e1b0b4ed4e51f3adf72560e09f65b6b8dc949",
    )
  })
})
