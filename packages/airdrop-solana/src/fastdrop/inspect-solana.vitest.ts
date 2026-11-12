import { address } from "@solana/kit"
import { describe, expect, it, vi } from "vitest"
import { fetchMerkleDistributor } from "../contracts/distributor/functions/fetch"
import { getDistributorPDA } from "../contracts/distributor/functions/pda"
import { HookType } from "../contracts/distributor/generated/types/hookType"
import { inspectSolana } from "./inspect-solana"

vi.mock("../contracts/distributor/functions/fetch", () => ({
  fetchMerkleDistributor: vi.fn(),
  fetchPenaltyConfig: vi.fn(),
  fetchStreamPreset: vi.fn(),
}))

vi.mock("../contracts/distributor/functions/configurator", () => ({
  resolveConfigurators: vi.fn(async () => [{
    index: 0, configurator: new Uint8Array(32), fallbackHook: 0,
    strategies: [{ hookType: HookType.Transfer, accountsCount: 0, proportion: 0n }],
  }]),
}))

describe("Solana campaign distributor role", () => {
  it.each(["PDA", "legacy base"])("resolves a %s to the same on-chain base", async (kind) => {
    const base = address("11111111111111111111111111111111")
    const mint = address("So11111111111111111111111111111111111111112")
    const [pda] = await getDistributorPDA(base)
    const account = vi.mocked(fetchMerkleDistributor)
    account.mockClear().mockImplementation(async (_rpc, key) =>
      key === pda ? ({ base, mint, dynamicRecipient: true } as NonNullable<Awaited<ReturnType<typeof fetchMerkleDistributor>>>) : null,
    )
    const verified = await inspectSolana({
      chainId: "sol:localnet", rpcUrl: "http://127.0.0.1:8899",
      root: `0x${"11".repeat(32)}`, roles: { contract: kind === "PDA" ? pda : base },
    })
    expect(verified).toEqual({ token: mint, strategies: ["transfer"], dynamicRecipient: true, solanaBase: base })
    expect(account.mock.calls.map(([, key]) => key)).toEqual(kind === "PDA" ? [pda] : [base, pda])
  })
})
