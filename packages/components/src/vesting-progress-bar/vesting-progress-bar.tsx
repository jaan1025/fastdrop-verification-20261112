import { formatTokenNumber } from "@repo/shared/utils"

export interface VestingProgressBarProps {
  /** Full allocation; denominator for the percentages and the Total legend value. */
  total: number
  /** Vested-to-date; MUST equal `claimed + on-chain claimable`, sourced from the
   *  same place as `claimed` so bar and legend don't jitter. */
  unlocked: number
  /** Amount the recipient has actually claimed (the primary-filled segment). */
  claimed: number
  /** Token ticker shown in the legend and aria-label. */
  tokenSymbol: string
}

/**
 * Stacked horizontal allocation bar — left-to-right reads as the lifecycle of a
 * stream's tokens:
 *
 *   [ claimed (primary) ][ unlocked-unclaimed (primary/50) ][ locked (track) ]
 *
 * The two filled segments together represent `unlocked` (vested). The ONE
 * canonical copy (deduped from the identical vesting-console + vesting-portal
 * copies).
 */
export function VestingProgressBar({
  total,
  unlocked,
  claimed,
  tokenSymbol,
}: VestingProgressBarProps) {
  const claimable = Math.max(unlocked - claimed, 0)
  const claimedPct = total > 0 ? (claimed / total) * 100 : 0
  const claimablePct = total > 0 ? (claimable / total) * 100 : 0

  return (
    <div className="space-y-2">
      <div
        className="bg-secondary relative h-2 w-full overflow-hidden"
        role="img"
        aria-label={`${formatTokenNumber(unlocked)} of ${formatTokenNumber(total)} ${tokenSymbol} unlocked, ${formatTokenNumber(claimed)} claimed`}
      >
        {claimedPct > 0 && (
          <div
            className="bg-primary absolute inset-y-0 left-0"
            style={{ width: `${Math.min(100, claimedPct)}%` }}
          />
        )}
        {claimablePct > 0 && (
          <div
            className="bg-primary/50 absolute inset-y-0"
            style={{
              left: `${Math.min(100, claimedPct)}%`,
              width: `${Math.min(100 - claimedPct, claimablePct)}%`,
            }}
          />
        )}
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="bg-primary size-2" />
          Claimed
          <span className="text-foreground font-mono tabular-nums">
            {formatTokenNumber(claimed)}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-primary/50 size-2" />
          Unlocked
          <span className="text-foreground font-mono tabular-nums">
            {formatTokenNumber(unlocked)}
          </span>
        </span>
        <span className="ml-auto">
          Total{" "}
          <span className="text-foreground font-mono tabular-nums">{formatTokenNumber(total)}</span>{" "}
          {tokenSymbol}
        </span>
      </div>
    </div>
  )
}
