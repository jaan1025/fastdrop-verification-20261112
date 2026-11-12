/**
 * Characterization tests for `sendTransaction` and `confirmTransaction`.
 *
 * Strategy:
 *  - Mock @solana/kit so tests run without a real RPC connection.
 *  - Mock `./squadsx/primitives/execution` so `waitForExecution` is injectable.
 *  - Mock `./simulate` so every test gets a passing simulation by default.
 *  - The low-level `confirm` is NOT mocked: the strategies call it as a
 *    cross-module binding which, with our fake RPC, resolves immediately.
 *    Tests supply a fake RPC whose getSignatureStatuses returns an immediately-
 *    confirmed status. The multisig boundary IS mockable because the squadsx
 *    confirm strategy (via `./squadsx/primitives/confirm`) imports
 *    `waitForExecution` from the ./squadsx/primitives/execution module.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

// ---------------------------------------------------------------------------
// Module mocks — declared before imports so Vitest hoists them correctly.
// ---------------------------------------------------------------------------

// Fake @solana/kit functions used by send.ts
const mockSignTransactionMessageWithSigners = vi.fn()
const mockAssertIsSendableTransaction = vi.fn()
const mockSendTransactionWithoutConfirmingFactory = vi.fn()
const mockGetSignatureFromTransaction = vi.fn()
const mockSetTransactionMessageLifetimeUsingBlockhash = vi.fn((_, msg) => msg)

vi.mock("@solana/kit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/kit")>()
  return {
    ...actual,
    signTransactionMessageWithSigners: (a: unknown) => mockSignTransactionMessageWithSigners(a),
    assertIsSendableTransaction: (a: unknown) => mockAssertIsSendableTransaction(a),
    sendTransactionWithoutConfirmingFactory: (a: unknown) =>
      mockSendTransactionWithoutConfirmingFactory(a),
    getSignatureFromTransaction: (a: unknown) => mockGetSignatureFromTransaction(a),
    setTransactionMessageLifetimeUsingBlockhash: (a: unknown, b: unknown) =>
      mockSetTransactionMessageLifetimeUsingBlockhash(a, b),
  }
})

// Fake simulate — always succeeds by default.
const mockSimulate = vi.fn()
vi.mock("../simulate", () => ({
  simulate: (a: unknown, b: unknown, c: unknown) => mockSimulate(a, b, c),
}))

// Note: the low-level `confirm` is NOT mocked — the strategies call it as a
// cross-module binding into transaction/confirm.ts that, with our fake RPC,
// resolves immediately. Instead, we drive confirmTransaction through a real
// (but fake) RPC that satisfies the polling logic in confirm(). The multisig
// boundary IS mockable because the squadsx confirm strategy (via
// ./squadsx/primitives/confirm) imports waitForExecution from the
// ./squadsx/primitives/execution module.

// Fake squadsx/primitives/execution — waitForExecution injectable.
// (squadsxConfirm reaches it through ./squadsx/primitives/confirm.)
const mockWaitForMultisigExecution = vi.fn()
vi.mock("./squadsx/primitives/execution", () => ({
  waitForExecution: (a: unknown) => mockWaitForMultisigExecution(a),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { sendTransaction } from "./send"
import { confirmTransaction } from "./confirm"

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const FAKE_SIG = "fake-sig-111"
const FAKE_PROPOSAL_SIG = "proposal-sig-222"
const FAKE_EXECUTION_SIG = "execution-sig-333"

const fakeRpc = {
  getLatestBlockhash: () => ({
    send: async () => ({
      value: { blockhash: "bh", lastValidBlockHeight: 100n },
    }),
  }),
  getSignatureStatuses: () => ({
    send: async () => ({ value: [{ confirmationStatus: "confirmed", err: null }] }),
  }),
} as never

const fakeMessage = {} as never
const standardWallet = { name: "Phantom" }
const squadsWallet = { name: "SquadsX" }

beforeEach(() => {
  vi.clearAllMocks()

  // Default: simulation succeeds.
  mockSimulate.mockResolvedValue({ success: true, unitsConsumed: 1000n })

  // Default: sign → return the same object (tagged as sendable).
  mockSignTransactionMessageWithSigners.mockImplementation(async (msg) => msg)
  mockAssertIsSendableTransaction.mockReturnValue(undefined)

  // Default: getSignatureFromTransaction → FAKE_SIG.
  mockGetSignatureFromTransaction.mockReturnValue(FAKE_SIG)

  // Default: sendTransactionWithoutConfirmingFactory → a factory that returns a
  // no-op send fn.
  mockSendTransactionWithoutConfirmingFactory.mockReturnValue(vi.fn().mockResolvedValue(undefined))

  // Default: waitForMultisigExecution → execution sig.
  mockWaitForMultisigExecution.mockResolvedValue(FAKE_EXECUTION_SIG)
})

// ---------------------------------------------------------------------------
// sendTransaction — standard wallet
// ---------------------------------------------------------------------------

describe("sendTransaction — standard wallet", () => {
  it('returns {kind:"standard", signature} without confirming', async () => {
    const handle = await sendTransaction({
      rpc: fakeRpc,
      txMessage: fakeMessage,
      wallet: standardWallet,
    })

    expect(handle).toEqual({ kind: "standard", signature: FAKE_SIG })
    // Confirm/wait must NOT have been called (no confirmation at send time).
    expect(mockWaitForMultisigExecution).not.toHaveBeenCalled()
  })

  it("calls sendTransactionWithoutConfirmingFactory (sends the tx)", async () => {
    const fakeSend = vi.fn().mockResolvedValue(undefined)
    mockSendTransactionWithoutConfirmingFactory.mockReturnValue(fakeSend)

    await sendTransaction({
      rpc: fakeRpc,
      txMessage: fakeMessage,
      wallet: standardWallet,
    })

    expect(mockSendTransactionWithoutConfirmingFactory).toHaveBeenCalledWith({
      rpc: fakeRpc,
    })
    expect(mockSimulate).toHaveBeenCalledBefore(mockSignTransactionMessageWithSigners)
    expect(fakeSend).toHaveBeenCalledTimes(1)
  })

  it("does not sign or send when simulation fails", async () => {
    mockSimulate.mockResolvedValue({
      success: false,
      errorMessage: "insufficient funds",
    })

    await expect(
      sendTransaction({
        rpc: fakeRpc,
        txMessage: fakeMessage,
        wallet: standardWallet,
      }),
    ).rejects.toThrow("Transaction simulation failed: insufficient funds")
    expect(mockSignTransactionMessageWithSigners).not.toHaveBeenCalled()
    expect(mockSendTransactionWithoutConfirmingFactory).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// sendTransaction — SquadsX wallet
// ---------------------------------------------------------------------------

describe("sendTransaction — SquadsX wallet", () => {
  beforeEach(() => {
    // SquadsX uses a different signature for the proposal tx.
    mockGetSignatureFromTransaction.mockReturnValue(FAKE_PROPOSAL_SIG)
  })

  it('returns {kind:"squadsx", proposalSignature} without waiting', async () => {
    const handle = await sendTransaction({
      rpc: fakeRpc,
      txMessage: fakeMessage,
      wallet: squadsWallet,
    })

    expect(handle).toEqual({
      kind: "squadsx",
      proposalSignature: FAKE_PROPOSAL_SIG,
    })

    // No confirmation or execution wait at send time.
    expect(mockWaitForMultisigExecution).not.toHaveBeenCalled()
  })

  it("sends the proposal transaction via sendTransactionWithoutConfirmingFactory", async () => {
    const fakeSend = vi.fn().mockResolvedValue(undefined)
    mockSendTransactionWithoutConfirmingFactory.mockReturnValue(fakeSend)

    await sendTransaction({
      rpc: fakeRpc,
      txMessage: fakeMessage,
      wallet: squadsWallet,
    })

    expect(fakeSend).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// confirmTransaction — standard handle
//
// confirm() is an intra-module call inside confirmTransaction (same file), so
// we can't mock it via vi.mock. Instead we supply a fake RPC whose
// getSignatureStatuses returns an immediately-confirmed status.
// ---------------------------------------------------------------------------

const confirmedRpc = {
  getLatestBlockhash: () => ({
    send: async () => ({
      value: { blockhash: "bh", lastValidBlockHeight: 100n },
    }),
  }),
  getSignatureStatuses: (sigs: unknown[]) => ({
    send: async () => ({
      value: sigs.map(() => ({
        confirmationStatus: "confirmed" as const,
        err: null,
      })),
    }),
  }),
} as never

describe("confirmTransaction — standard handle", () => {
  it("resolves with the signature when the tx is confirmed", async () => {
    const result = await confirmTransaction(
      { kind: "standard", signature: FAKE_SIG as string },
      { rpc: confirmedRpc },
    )

    expect(result).toBe(FAKE_SIG)
    expect(mockWaitForMultisigExecution).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// confirmTransaction — squadsx handle
//
// waitForExecution IS mockable (imported via ./squadsx/primitives/execution).
// After it resolves, confirmTransaction calls confirm() with the execution sig.
// We verify the right signature is threaded through by asserting on the result.
// ---------------------------------------------------------------------------

describe("confirmTransaction — squadsx handle", () => {
  it("calls waitForMultisigExecution with the proposal sig then resolves execution sig", async () => {
    const result = await confirmTransaction(
      { kind: "squadsx", proposalSignature: FAKE_PROPOSAL_SIG },
      { rpc: confirmedRpc },
    )

    // waitForMultisigExecution must be called with the proposal sig.
    expect(mockWaitForMultisigExecution).toHaveBeenCalledOnce()
    expect(mockWaitForMultisigExecution).toHaveBeenCalledWith(
      expect.objectContaining({
        rpc: confirmedRpc,
        proposalSignature: FAKE_PROPOSAL_SIG,
      }),
    )

    // The result must be the EXECUTION signature (from waitForMultisigExecution),
    // not the proposal signature.
    expect(result).toBe(FAKE_EXECUTION_SIG)
    expect(result).not.toBe(FAKE_PROPOSAL_SIG)
  })

  it("does NOT resolve with the proposal signature", async () => {
    const result = await confirmTransaction(
      { kind: "squadsx", proposalSignature: FAKE_PROPOSAL_SIG },
      { rpc: confirmedRpc },
    )

    expect(result).toBe(FAKE_EXECUTION_SIG)
    expect(result).not.toBe(FAKE_PROPOSAL_SIG)
  })
})
