import { match } from "@repo/shared/utils"
import type { Configuration } from "./types"
import { executeConfiguration, zeroOutcomeFor, type ConfigurationOutcome } from "./execute"
import { transferOutcome } from "./transfer/outcome"
import { penaltyOutcome } from "./linear-penalty/outcome"
import { lockOutcome } from "./lock/outcome"
import { customOutcome } from "./custom/outcome"

/**
 * Quote: what claiming `amount` at `atUnix` does, per strategy and in total —
 * how much lands in the wallet (`claimed`), stays in the vault (`forfeited`),
 * and moves into a stream (`locked`). `amount` is the consumption delta being
 * evaluated: `released − consumed` for a live allocation.
 *
 * This is the ONE evaluation of a configuration — the attribution door
 * (`configurationClaimed`) replays it at each recorded claim instant.
 *
 * A `linearPenaltyHook` strategy without terms behaves like an UNSET EVM
 * penalty config (`penaltyConfigs[id] == {0,0}` → zero penalty, zero
 * consumption; the slice falls through to the fallback). That lenience is
 * EVM-only semantics: a Solana penalty strategy CANNOT claim without its
 * `PenaltyConfig` account (the program requires the PDA), so terms-less on
 * Solana means the resolver couldn't read the account — the quote then
 * UNDER-reports forfeiture rather than failing. Display-lenient by design.
 */
export function configurationClaimable(params: {
  configuration: Configuration
  amount: bigint
  atUnix: bigint
}): ConfigurationOutcome {
  const { configuration, amount, atUnix } = params
  return executeConfiguration(configuration, amount, (strategy, share) =>
    match(strategy.kind, {
      transferHook: () => transferOutcome(share),
      linearPenaltyHook: () =>
        strategy.penalty
          ? penaltyOutcome(share, strategy.penalty, atUnix)
          : zeroOutcomeFor("linearPenaltyHook"),
      lockHook: () => lockOutcome(share),
      customHook: () => customOutcome(share),
    }),
  )
}
