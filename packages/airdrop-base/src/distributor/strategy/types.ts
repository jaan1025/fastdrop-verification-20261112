import type { ChainKind } from "@repo/acs-client/model"

/**
 * The canonical strategy vocabulary — same spelling as the form-side
 * `StrategyCodeInput['hook']` (configuration-code.ts) so the package speaks ONE
 * strategy language. Chain packages map their wire identities onto this: EVM
 * hook ADDRESSES (transfer-with-cap → `transferHook`, coin-flip → `customHook`),
 * Solana `HookType` enum (Transfer/Lock/Penalty).
 */
export type StrategyKind = "transferHook" | "linearPenaltyHook" | "lockHook" | "customHook"

/**
 * What one strategy does with the slice of allocation it is handed, in the
 * contract's own accounting. Two fields are universal — `consumed` mirrors
 * `IHook.execute`'s `_consumed` return, and `claimed` answers the one question
 * every strategy must answer: how much landed in the wallet. Each arm then
 * carries ONLY the destination that exists for it (a transfer/lock never
 * forfeits, a penalty never locks):
 *
 * - transfer/custom → `claimed` == consumed (delivered at claim time)
 * - penalty         → `forfeited` == consumed, `claimed` 0 (the hook transfers
 *                     nothing; the recipient's remainder is the FALLBACK's claim)
 * - lock            → `locked` == consumed, `claimed` 0 at claim time (the
 *                     stream's own released/claimed life-cycle stays in
 *                     `../../stream`)
 *
 * Per-arm invariant: consumed = claimed + forfeited/locked (whichever exists).
 *
 * The on-chain ledger field the contracts store as `claimed`
 * (`ClaimInfo.claimedAmount` / `ClaimStatus.claimed`) is a misnomer — it is the
 * cumulative CONSUMED amount. In this package `claimed` strictly means
 * "landed in the wallet".
 */
export interface TransferOutcome {
  kind: Extract<StrategyKind, "transferHook">
  consumed: bigint
  claimed: bigint
}
export interface PenaltyOutcome {
  kind: Extract<StrategyKind, "linearPenaltyHook">
  consumed: bigint
  /** Always 0n — the penalty hook forfeits its consumption, delivers nothing. */
  claimed: bigint
  forfeited: bigint
}
export interface LockOutcome {
  kind: Extract<StrategyKind, "lockHook">
  consumed: bigint
  /** Always 0n at claim time — the slice vests via the stream, not the wallet. */
  claimed: bigint
  locked: bigint
}
/** Unknown semantics — ASSUMED full delivery (see `custom/claimable.ts`). */
export interface CustomOutcome {
  kind: Extract<StrategyKind, "customHook">
  consumed: bigint
  claimed: bigint
}
export type StrategyOutcome = TransferOutcome | PenaltyOutcome | LockOutcome | CustomOutcome

/**
 * The cross-strategy aggregate of a configuration pass — the ONLY shape where
 * all destinations coexist. Invariant: consumed = claimed + forfeited + locked.
 */
export interface OutcomeTotals {
  consumed: bigint
  claimed: bigint
  forfeited: bigint
  locked: bigint
}

/**
 * Penalty curve terms, discriminated by chain — a sanctioned dual-format
 * contract (like `StreamTerms`): the two arms are DIFFERENT on-chain models,
 * not one model at two scales.
 *
 * - EVM `LinearPenaltyHook` hardcodes a 100%→0 linear decay over
 *   `[beginTime, endTime]`; the config stores only the window.
 * - Solana `PenaltyConfig` interpolates `startPenalty → endPenalty`
 *   (WAD_SOL-scaled, 1e9 = 100%), supporting increasing curves too.
 */
export type PenaltyTerms =
  | {
      chainKind: Extract<ChainKind, "evm">
      beginTime: bigint
      endTime: bigint
    }
  | {
      chainKind: Extract<ChainKind, "solana">
      beginTime: bigint
      endTime: bigint
      /** Penalty rate at `beginTime` (WAD_SOL, 1e9 = 100%). */
      startPenalty: bigint
      /** Penalty rate at `endTime` (WAD_SOL, 1e9 = 100%). */
      endPenalty: bigint
    }

/** One weighted strategy inside a batch configuration. */
export interface ConfigurationStrategy {
  kind: StrategyKind
  /** WAD-scaled proportion (1e18 EVM / 1e9 Solana), as stored on-chain. */
  proportion: bigint
  /** Present iff `kind === 'linearPenaltyHook'`. */
  penalty?: PenaltyTerms
}

/**
 * The normalized on-chain batch configuration (`BatchConfiguration` /
 * `BatchConfig`): weighted strategies plus the fallback index that absorbs
 * `amount − Σ consumed`. `fallbackIndex === strategies.length` means no
 * fallback (both contracts allow it).
 */
export interface Configuration {
  chainKind: ChainKind
  strategies: ConfigurationStrategy[]
  fallbackIndex: number
}

/**
 * One past claim, as the ledger saw it: the consumption delta
 * (`released − previously consumed` at that claim) and the on-chain instant the
 * hooks evaluated at (block timestamp / block time of the claim slot). The
 * penalty curve is time-dependent, so attribution NEEDS the instant.
 */
export interface ClaimRecord {
  consumedDelta: bigint
  claimAtUnix: bigint
}
