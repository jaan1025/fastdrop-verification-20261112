import { match, matchUnion } from "@repo/shared/utils"
import type {
  ConfigurationStrategy,
  OutcomeTotals,
  Configuration,
  StrategyKind,
  StrategyOutcome,
} from "./types"
import { strategyShare } from "./split"

/** A per-strategy evaluator: `(strategy, its slice) → outcome`. */
export type StrategyEvaluate = (strategy: ConfigurationStrategy, share: bigint) => StrategyOutcome

/** The composed result of one configuration pass over an amount. */
export interface ConfigurationOutcome {
  /**
   * Cross-strategy aggregate over `byStrategy`. For an on-chain-VALID
   * configuration `total.consumed` equals the evaluated amount; a malformed
   * over-consuming configuration (Σ proportions > WAD — the contract would
   * revert the claim) yields `total.consumed > amount`, so do NOT treat
   * `consumed ≤ amount` as an invariant of this quote.
   */
  total: OutcomeTotals
  /** Index-aligned with `configuration.strategies` (fallback included). */
  byStrategy: StrategyOutcome[]
}

/** The kind-shaped nothing-happened outcome (skipped slot / unset penalty). */
export function zeroOutcomeFor(kind: StrategyKind): StrategyOutcome {
  return match(kind, {
    transferHook: (): StrategyOutcome => ({
      kind: "transferHook",
      consumed: 0n,
      claimed: 0n,
    }),
    linearPenaltyHook: (): StrategyOutcome => ({
      kind: "linearPenaltyHook",
      consumed: 0n,
      claimed: 0n,
      forfeited: 0n,
    }),
    lockHook: (): StrategyOutcome => ({
      kind: "lockHook",
      consumed: 0n,
      claimed: 0n,
      locked: 0n,
    }),
    customHook: (): StrategyOutcome => ({
      kind: "customHook",
      consumed: 0n,
      claimed: 0n,
    }),
  })
}

/** Same-kind field-wise sum — accumulating one strategy slot across records. */
export function addStrategyOutcomes(a: StrategyOutcome, b: StrategyOutcome): StrategyOutcome {
  if (a.kind !== b.kind) {
    // Unreachable when summing index-aligned slots of one configuration.
    throw new Error(`addStrategyOutcomes: kind mismatch (${a.kind} vs ${b.kind})`)
  }
  return matchUnion(a, "kind", {
    transferHook: (t): StrategyOutcome => ({
      ...t,
      consumed: t.consumed + b.consumed,
      claimed: t.claimed + b.claimed,
    }),
    linearPenaltyHook: (p): StrategyOutcome => ({
      ...p,
      consumed: p.consumed + b.consumed,
      claimed: p.claimed + b.claimed,
      forfeited: p.forfeited + (b as typeof p).forfeited,
    }),
    lockHook: (l): StrategyOutcome => ({
      ...l,
      consumed: l.consumed + b.consumed,
      claimed: l.claimed + b.claimed,
      locked: l.locked + (b as typeof l).locked,
    }),
    customHook: (c): StrategyOutcome => ({
      ...c,
      consumed: c.consumed + b.consumed,
      claimed: c.claimed + b.claimed,
    }),
  })
}

export const zeroOutcomeTotals = (): OutcomeTotals => ({
  consumed: 0n,
  claimed: 0n,
  forfeited: 0n,
  locked: 0n,
})

export function addOutcomeTotals(a: OutcomeTotals, b: OutcomeTotals): OutcomeTotals {
  return {
    consumed: a.consumed + b.consumed,
    claimed: a.claimed + b.claimed,
    forfeited: a.forfeited + b.forfeited,
    locked: a.locked + b.locked,
  }
}

/** Fold per-strategy outcomes into the cross-strategy aggregate. */
export function outcomeTotals(outcomes: StrategyOutcome[]): OutcomeTotals {
  return outcomes.reduce<OutcomeTotals>(
    (acc, outcome) => ({
      consumed: acc.consumed + outcome.consumed,
      claimed: acc.claimed + outcome.claimed,
      forfeited: acc.forfeited + ("forfeited" in outcome ? outcome.forfeited : 0n),
      locked: acc.locked + ("locked" in outcome ? outcome.locked : 0n),
    }),
    zeroOutcomeTotals(),
  )
}

/**
 * The ONE mirror of the distributor's `_execute` loop (Distributor.sol /
 * claim.rs `execute_hooks`), shared by the quote (`claimable.ts`) and the
 * attribution (`claimed.ts`) doors:
 *
 *   1. every non-fallback strategy is handed `amount × proportion / WAD` and
 *      consumes some of it;
 *   2. the fallback strategy is handed `amount − Σ consumed`;
 *   3. on-chain, Σ consumed must equal `amount` exactly.
 *
 * `fallbackIndex === strategies.length` = no fallback (both contracts allow
 * it). A negative fallback remainder (over-consuming strategies) is clamped to
 * zero — on-chain that claim reverts `InsufficientAllocation`, so the clamp
 * only defends display against a malformed configuration.
 */
export function executeConfiguration(
  configuration: Configuration,
  amount: bigint,
  evaluate: StrategyEvaluate,
): ConfigurationOutcome {
  const { strategies, fallbackIndex, chainKind } = configuration
  const byStrategy = strategies.map((s) => zeroOutcomeFor(s.kind))

  let consumed = 0n
  strategies.forEach((strategy, i) => {
    if (i === fallbackIndex) return
    const outcome = evaluate(strategy, strategyShare(amount, strategy.proportion, chainKind))
    byStrategy[i] = outcome
    consumed += outcome.consumed
  })

  const fallback = strategies[fallbackIndex]
  if (fallback) {
    const remainder = amount - consumed
    byStrategy[fallbackIndex] = evaluate(fallback, remainder > 0n ? remainder : 0n)
  }

  return { total: outcomeTotals(byStrategy), byStrategy }
}
