import { differenceInDays, format, formatDistance } from "date-fns"
import { utc } from "@date-fns/utc"
import { formatUtc, parseUtcDate } from "@repo/shared/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip"

const DEFAULT_ABSOLUTE_THRESHOLD_DAYS = 30

export function RelativeTime({
  date,
  now = new Date(),
  thresholdDays = DEFAULT_ABSOLUTE_THRESHOLD_DAYS,
  className,
}: {
  date: Date | string
  now?: Date
  thresholdDays?: number
  className?: string
}) {
  // String inputs are backend timestamps (zoneless `NaiveDateTime`) → pin to
  // UTC via `parseUtcDate` so the relative label and the `{ in: utc }` tooltip
  // reflect the true instant, not the viewer's local interpretation.
  const resolved = typeof date === "string" ? parseUtcDate(date) : date
  // Degrade gracefully on an unparseable/empty date (e.g. a missing `createAt`)
  // — date-fns `formatDistance`/`format` throw on an Invalid Date.
  if (Number.isNaN(resolved.getTime())) {
    return (
      <span className={`text-muted-foreground ${className ?? ""}`} aria-hidden>
        —
      </span>
    )
  }
  // Past the threshold an absolute short date reads better than "N days ago".
  const label =
    differenceInDays(now, resolved) > thresholdDays
      ? format(resolved, "MMM d, yyyy", { in: utc })
      : formatDistance(resolved, now, { addSuffix: true })

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`text-muted-foreground cursor-default ${className ?? ""}`}>{label}</span>
      </TooltipTrigger>
      <TooltipContent>
        {/* Full instant in UTC — the canonical absolute display from date.ts. */}
        <span className="font-mono text-xs">{formatUtc(resolved)}</span>
      </TooltipContent>
    </Tooltip>
  )
}
