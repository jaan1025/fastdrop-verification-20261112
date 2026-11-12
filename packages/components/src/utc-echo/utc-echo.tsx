import { formatLocal, formatUtc, type TimeInput } from "@repo/shared/utils"
import { cn } from "@repo/ui/lib/utils"

/**
 * The live UTC read-back for a datetime input. A `datetime-local` field is
 * zoneless and looks like a local picker, so an operator can easily enter their
 * own wall-clock while the value is interpreted as UTC. This echoes the resolved
 * instant in BOTH the canonical UTC (what gets stored / deployed) and the
 * viewer's local zone with an explicit offset (the cross-check) — so a mismatch
 * ("I meant my local time") is obvious at entry. Renders nothing until the field
 * holds a parseable value.
 */
export function UtcEcho({
  value,
  className,
}: {
  value: TimeInput | null | undefined
  className?: string
}) {
  if (value == null || value === "") return null
  const utc = formatUtc(value)
  if (utc === "—") return null
  return (
    <p className={cn("text-muted-foreground text-xs tabular-nums", className)}>
      <span className="text-foreground font-medium">{utc}</span>
      <span className="mx-1.5">·</span>
      <span>local {formatLocal(value)}</span>
    </p>
  )
}
