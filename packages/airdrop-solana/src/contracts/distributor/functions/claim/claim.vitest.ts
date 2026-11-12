import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AccountRole, type Address } from "@solana/kit"
import { HookType } from "../../generated/types/hookType"
import type { Strategy } from "../../generated/types/strategy"
import { CLIQUE_LOCK_PROGRAM_ADDRESS } from "../../../lock/generated/programs/cliqueLock"

// ---------------------------------------------------------------------------
// Mocks — distributorClaim is the 6-step orchestration core (analysis H3).
// We mock every I/O dep so we can assert the ROUTING decisions: which hook is
// detected → which remaining-accounts path → compute limit → SquadsX cache/LUT.
// ---------------------------------------------------------------------------

const fetchBatchConfigMock = vi.fn()
const fetchMerkleDistributorMock = vi.fn()
const fetchStreamPresetMock = vi.fn()
vi.mock("../fetch", () => ({
  fetchBatchConfig: (...a: unknown[]) => fetchBatchConfigMock(...a),
  fetchMerkleDistributor: (...a: unknown[]) => fetchMerkleDistributorMock(...a),
  fetchStreamPreset: (...a: unknown[]) => fetchStreamPresetMock(...a),
}))

const getFeeConfigPDAMock = vi.fn()
const getPenaltyConfigPDAMock = vi.fn()
const getStreamPresetPDAMock = vi.fn()
vi.mock("../pda", () => ({
  getFeeConfigPDA: (...a: unknown[]) => getFeeConfigPDAMock(...a),
  getPenaltyConfigPDA: (...a: unknown[]) => getPenaltyConfigPDAMock(...a),
  getStreamPresetPDA: (...a: unknown[]) => getStreamPresetPDAMock(...a),
}))

const deriveAtaMock = vi.fn()
const getMintTokenProgramMock = vi.fn()
vi.mock("@repo/chain-solana-kit/token", () => ({
  deriveAta: (...a: unknown[]) => deriveAtaMock(...a),
  getMintTokenProgram: (...a: unknown[]) => getMintTokenProgramMock(...a),
}))

vi.mock("../compute-units", () => ({ LOCK_HOOK_COMPUTE_UNITS: 400_000 }))

// The generic chain-wiring primitives this orchestration core uses come through
// two kit doors: the leaf `logger` via `/utils`, the tx pipeline (walletTx /
// ensureTxFits / LUT cache) via `/transaction`. Keep each door's mocks in ONE
// factory (separate `vi.mock` calls for the same module path overwrite each other).
const sendTransactionMock = vi.fn()
const ensureTxFitsMock = vi.fn()
const getLutCacheMock = vi.fn()
const setLutCacheMock = vi.fn()
vi.mock("@repo/chain-solana-kit/utils", () => ({
  logger: { warn: vi.fn() },
}))
vi.mock("@repo/chain-solana-kit/transaction", () => ({
  walletTx: { send: (...a: unknown[]) => sendTransactionMock(...a) },
  ensureTxFits: (...a: unknown[]) => ensureTxFitsMock(...a),
  getLutCache: (...a: unknown[]) => getLutCacheMock(...a),
  setLutCache: (...a: unknown[]) => setLutCacheMock(...a),
}))

const buildClaimInstructionsMock = vi.fn()
vi.mock("./build-claim-instructions", () => ({
  buildClaimInstructions: (...a: unknown[]) => buildClaimInstructionsMock(...a),
  // real cache key — string concat, no I/O
  buildClaimCacheKey: (claimer: string, base: string, root: Uint8Array) =>
    `${claimer}:${base}:0x${Array.from(root)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`,
}))

const prepareLockHookContextMock = vi.fn()
vi.mock("../../strategies/lock/lock-hook-accounts", () => ({
  prepareLockHookContext: (...a: unknown[]) => prepareLockHookContextMock(...a),
}))

const buildPenaltyHookRemainingAccountsMock = vi.fn()
vi.mock("../../strategies/penalty/penalty-accounts", () => ({
  buildPenaltyHookRemainingAccounts: (...a: unknown[]) =>
    buildPenaltyHookRemainingAccountsMock(...a),
}))

// Mock @solana/kit tx-message builders to no-ops returning a sentinel, keeping
// `address()` real (validates base58 recipient).
vi.mock("@solana/kit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/kit")>()
  return {
    ...actual,
    appendTransactionMessageInstructions: vi.fn(() => "BASE_MESSAGE"),
    createTransactionMessage: vi.fn(() => "EMPTY"),
    setTransactionMessageFeePayerSigner: vi.fn((_p, m) => m),
    setTransactionMessageLifetimeUsingBlockhash: vi.fn((_b, m) => m),
  }
})

import { distributorClaim, type DistributorClaimContext } from "./claim"

// Valid base58 Solana addresses (recipient is the only arg run through address()).
const RECIPIENT = "So11111111111111111111111111111111111111112" as Address
const MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address
const VAULT = "Vau1tVau1tVau1tVau1tVau1tVau1tVau1tVau1tVau1" as Address
const LUT_COMMON = "LUTcommon1111111111111111111111111111111111" as Address
const LUT_CACHED = "LUTcached1111111111111111111111111111111111" as Address
const LUT_EXTRA = "LUText11111111111111111111111111111111111111" as Address
const PENALTY_PDA = "Pen1tyPDA111111111111111111111111111111111" as Address
const FEE_PDA = "FeePDA1111111111111111111111111111111111111" as Address

const lockStrategy: Strategy = { hookType: HookType.Lock, proportion: 0n, accountsCount: 12 }
const penaltyStrategy: Strategy = {
  hookType: HookType.Penalty,
  proportion: 200_000_000n,
  accountsCount: 1,
}
const transferStrategy: Strategy = {
  hookType: HookType.Transfer,
  proportion: 100_000_000n,
  accountsCount: 0,
}

const STREAM_PRESET_PDA = "StreamPresetPda" as Address
const LOCK_REMAINING = Array.from({ length: 12 }, (_, index) => ({
  address: index === 0 ? STREAM_PRESET_PDA : (`lock-account-${index}` as Address),
  role: [2, 3, 4, 5, 7].includes(index) ? AccountRole.WRITABLE : AccountRole.READONLY,
}))
const PENALTY_REMAINING = [{ address: PENALTY_PDA, role: AccountRole.READONLY }]

const baseCtx = (): DistributorClaimContext => ({
  rpc: {
    getLatestBlockhash: () => ({ send: async () => ({ value: "BLOCKHASH" }) }),
  } as never,
  ws: undefined,
  wallet: null,
  payer: { address: "Payer" } as never,
  recipient: RECIPIENT,
  base: "Base111111111111111111111111111111111111111" as Address,
  handler: new Uint8Array([1]),
  root: new Uint8Array(32).fill(7),
  configurator: new Uint8Array([2]),
  distributorPda: "Dist" as Address,
  claimRootPda: "Root" as Address,
  batchConfigPda: "BatchCfg" as Address,
  amount: 1000n,
  released: 500n,
  proof: ["0xabcd"],
  sig: "0x1234",
  extra: new Uint8Array([0, 1]),
  commonLutAddress: LUT_COMMON,
})

const setBatchStrategies = (strategies: Strategy[], fallbackHook = 0) =>
  fetchBatchConfigMock.mockResolvedValue({ strategies, fallbackHook })

beforeEach(() => {
  fetchMerkleDistributorMock.mockResolvedValue({ mint: MINT, vault: VAULT })
  getMintTokenProgramMock.mockResolvedValue("TokenProg")
  deriveAtaMock.mockResolvedValue("FromAta")
  getFeeConfigPDAMock.mockResolvedValue([FEE_PDA])
  getPenaltyConfigPDAMock.mockResolvedValue([PENALTY_PDA])
  getStreamPresetPDAMock.mockResolvedValue([STREAM_PRESET_PDA])
  fetchStreamPresetMock.mockResolvedValue({ lockProgram: CLIQUE_LOCK_PROGRAM_ADDRESS })
  prepareLockHookContextMock.mockResolvedValue(LOCK_REMAINING)
  buildPenaltyHookRemainingAccountsMock.mockReturnValue(PENALTY_REMAINING)
  buildClaimInstructionsMock.mockResolvedValue({ instructions: ["IX"] })
  ensureTxFitsMock.mockResolvedValue({ txMessage: "TXMSG", extraLutAddress: undefined })
  sendTransactionMock.mockResolvedValue({ kind: "standard", signature: "TX_SIGNATURE" })
  getLutCacheMock.mockReturnValue(null)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("distributorClaim — pipeline ordering & result", () => {
  it("throws when the batch config is missing", async () => {
    fetchBatchConfigMock.mockResolvedValue(null)
    await expect(distributorClaim(baseCtx())).rejects.toThrow("Batch config not found")
  })

  it("throws when the distributor is missing", async () => {
    setBatchStrategies([transferStrategy])
    fetchMerkleDistributorMock.mockResolvedValue(null)
    await expect(distributorClaim(baseCtx())).rejects.toThrow("Distributor not found")
  })

  it("returns the SolanaTxHandle on success", async () => {
    setBatchStrategies([transferStrategy])
    await expect(distributorClaim(baseCtx())).resolves.toEqual({
      kind: "standard",
      signature: "TX_SIGNATURE",
    })
  })

  it("binds the on-chain claimer to ctx.recipient", async () => {
    setBatchStrategies([transferStrategy])
    await distributorClaim(baseCtx())
    const ix = buildClaimInstructionsMock.mock.calls[0]![0] as { claimer: string }
    expect(ix.claimer).toBe(RECIPIENT)
  })

  it("derives fromAta from the distributor vault+mint and passes mint/vault through", async () => {
    setBatchStrategies([transferStrategy])
    await distributorClaim(baseCtx())
    expect(deriveAtaMock).toHaveBeenCalledWith(VAULT, MINT, "TokenProg")
    const ix = buildClaimInstructionsMock.mock.calls[0]![0] as Record<string, unknown>
    expect(ix.fromAta).toBe("FromAta")
    expect(ix.mint).toBe(MINT)
    expect(ix.vault).toBe(VAULT)
    expect(ix.feeConfigPda).toBe(FEE_PDA)
  })
})

describe("distributorClaim — hook account layout", () => {
  it("transfer-only: NO remaining accounts, NO compute-unit override", async () => {
    setBatchStrategies([transferStrategy])
    await distributorClaim(baseCtx())
    const ix = buildClaimInstructionsMock.mock.calls[0]![0] as Record<string, unknown>
    expect(ix.remainingAccounts).toBeUndefined()
    expect(ix.computeUnitLimit).toBeUndefined()
    expect(prepareLockHookContextMock).not.toHaveBeenCalled()
    expect(buildPenaltyHookRemainingAccountsMock).not.toHaveBeenCalled()
  })

  it("lock hook: attaches lock remaining accounts + LOCK_HOOK_COMPUTE_UNITS (400000)", async () => {
    setBatchStrategies([lockStrategy])
    await distributorClaim(baseCtx())
    expect(prepareLockHookContextMock).toHaveBeenCalledOnce()
    const ix = buildClaimInstructionsMock.mock.calls[0]![0] as Record<string, unknown>
    expect(ix.remainingAccounts).toEqual(LOCK_REMAINING)
    expect(ix.computeUnitLimit).toBe(400_000)
    // penalty path NOT taken
    expect(buildPenaltyHookRemainingAccountsMock).not.toHaveBeenCalled()
  })

  it("penalty hook: attaches the penalty-config account, NO compute-unit override", async () => {
    setBatchStrategies([penaltyStrategy])
    await distributorClaim(baseCtx())
    expect(getPenaltyConfigPDAMock).toHaveBeenCalledWith({
      distributor: "Dist",
      configurator: baseCtx().configurator,
    })
    const ix = buildClaimInstructionsMock.mock.calls[0]![0] as Record<string, unknown>
    expect(ix.remainingAccounts).toEqual(PENALTY_REMAINING)
    expect(ix.computeUnitLimit).toBeUndefined()
  })

  it("keeps the Lock fallback in its slot and repeats the Penalty account for each index", async () => {
    setBatchStrategies([penaltyStrategy, lockStrategy, transferStrategy, penaltyStrategy], 1)
    const ctx = baseCtx()
    await distributorClaim(ctx)
    expect(buildClaimInstructionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        remainingAccounts: [...PENALTY_REMAINING, ...LOCK_REMAINING, ...PENALTY_REMAINING],
        computeUnitLimit: 400_000,
        extra: ctx.extra,
      }),
    )
  })

  it.each([
    { strategy: transferStrategy, accountsCount: 1 },
    { strategy: lockStrategy, accountsCount: 11 },
    { strategy: penaltyStrategy, accountsCount: 0 },
  ])(
    "rejects an incorrect account count in the fallback slot ($strategy.hookType)",
    async ({ strategy, accountsCount }) => {
      setBatchStrategies([transferStrategy, { ...strategy, accountsCount }], 1)
      await expect(distributorClaim(baseCtx())).rejects.toThrow(/strategy 1.*accountsCount/i)
      expect(buildClaimInstructionsMock).not.toHaveBeenCalled()
    },
  )

  it("rejects multiple Lock strategies because both would initialize the same stream", async () => {
    setBatchStrategies([lockStrategy, lockStrategy], 1)
    await expect(distributorClaim(baseCtx())).rejects.toThrow(/multiple lock strategies/i)
    expect(buildClaimInstructionsMock).not.toHaveBeenCalled()
  })

  it("rejects a missing StreamPreset before building the claim", async () => {
    setBatchStrategies([lockStrategy])
    fetchStreamPresetMock.mockResolvedValue(null)
    await expect(distributorClaim(baseCtx())).rejects.toThrow(/stream preset not found/i)
    expect(buildClaimInstructionsMock).not.toHaveBeenCalled()
  })

  it("rejects a StreamPreset targeting a different lock program", async () => {
    setBatchStrategies([lockStrategy])
    fetchStreamPresetMock.mockResolvedValue({ lockProgram: RECIPIENT })
    await expect(distributorClaim(baseCtx())).rejects.toThrow(/unsupported lock program/i)
    expect(buildClaimInstructionsMock).not.toHaveBeenCalled()
  })
})

describe("distributorClaim — LUT cache (read-only, multisig-safe)", () => {
  it("passes the cached LUT read-only alongside the common LUT, with no preferExtraLut knob", async () => {
    setBatchStrategies([lockStrategy])
    getLutCacheMock.mockReturnValue(LUT_CACHED)
    await distributorClaim(baseCtx())
    expect(getLutCacheMock).toHaveBeenCalledOnce()
    const lutArg = ensureTxFitsMock.mock.calls[0]![0] as {
      lutAddresses: string[]
    }
    expect(lutArg.lutAddresses).toEqual([LUT_COMMON, LUT_CACHED])
    // the stale "drive LUT creation for SquadsX" knob is gone
    expect("preferExtraLut" in lutArg).toBe(false)
  })

  it("passes the claimant LUT policy and does not send if the transaction cannot fit", async () => {
    setBatchStrategies([transferStrategy])
    getLutCacheMock.mockReturnValue(LUT_CACHED)
    const fitError = new Error("Transaction exceeds the Solana size limit")
    ensureTxFitsMock.mockRejectedValue(fitError)

    const ctx = { ...baseCtx(), allowCreateLut: false }
    await expect(distributorClaim(ctx)).rejects.toBe(fitError)
    expect(ensureTxFitsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        allowCreateLut: false,
        lutAddresses: [LUT_COMMON, LUT_CACHED],
      }),
    )
    expect(sendTransactionMock).not.toHaveBeenCalled()
  })

  it("forwards the wallet so the multisig guard inside ensureTxFits applies", async () => {
    setBatchStrategies([lockStrategy])
    const ctx = { ...baseCtx(), wallet: { name: "SquadsX" } as never }
    await distributorClaim(ctx)
    const lutArg = ensureTxFitsMock.mock.calls[0]![0] as {
      wallet: { name: string }
    }
    expect(lutArg.wallet).toEqual({ name: "SquadsX" })
  })

  it("persists a freshly created LUT for reuse on later attempts (never clears it)", async () => {
    setBatchStrategies([lockStrategy])
    getLutCacheMock.mockReturnValue(null)
    ensureTxFitsMock.mockResolvedValue({ txMessage: "TXMSG", extraLutAddress: LUT_EXTRA })
    await distributorClaim(baseCtx())
    expect(setLutCacheMock).toHaveBeenCalledWith(expect.any(String), LUT_EXTRA)
  })

  it("does not write the cache when ensureTxFits created no fresh LUT", async () => {
    setBatchStrategies([transferStrategy])
    getLutCacheMock.mockReturnValue(null)
    ensureTxFitsMock.mockResolvedValue({ txMessage: "TXMSG", extraLutAddress: undefined })
    await distributorClaim(baseCtx())
    const lutArg = ensureTxFitsMock.mock.calls[0]![0] as { lutAddresses: string[] }
    expect(lutArg.lutAddresses).toEqual([LUT_COMMON]) // no cached LUT to add
    expect(setLutCacheMock).not.toHaveBeenCalled()
  })
})
