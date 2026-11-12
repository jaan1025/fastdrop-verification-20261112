import type { ClaimRecord, Configuration } from "./types"
import {
  addOutcomeTotals,
  addStrategyOutcomes,
  zeroOutcomeFor,
  zeroOutcomeTotals,
  type ConfigurationOutcome,
} from "./execute"
import { configurationClaimable } from "./claimable"

/**
 * Attribution: what past claims ACTUALLY delivered, per strategy and in total.
 *
 * A fold of the quote: each record's `consumedDelta` was that claim's exact
 * on-chain split input (the contract asserts `Σ consumed == claimable`), and
 * every hook is deterministic in `claimAt` — so replaying
 * `configurationClaimable` at the recorded instant reproduces the on-chain
 * outcome. This is how the ledger's single cumulative `consumed` number
 * decomposes back into wallet-claimed / forfeited / locked.
 */
export function configurationClaimed(params: {
  configuration: Configuration
  records: ClaimRecord[]
}): ConfigurationOutcome {
  const { configuration, records } = params
  return records
    .map((record) =>
      configurationClaimable({
        configuration,
        amount: record.consumedDelta,
        atUnix: record.claimAtUnix,
      }),
    )
    .reduce<ConfigurationOutcome>(
      (acc, outcome) => ({
        total: addOutcomeTotals(acc.total, outcome.total),
        byStrategy: acc.byStrategy.map((s, i) => addStrategyOutcomes(s, outcome.byStrategy[i]!)),
      }),
      {
        total: zeroOutcomeTotals(),
        byStrategy: configuration.strategies.map((s) => zeroOutcomeFor(s.kind)),
      },
    )
}
