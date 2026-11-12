import { formatUtc, toIsoString, type TimeInput } from "@repo/shared/utils"
import { CopyableValue } from "../copyable-value"

/** The prop type — any timestamp wire form. Aliases the shared {@link TimeInput};
 *  parse + format live in `@repo/shared/utils/date`. */
export type TimestampInput = TimeInput

/**
 * Absolute UTC timestamp display with copy button. Accepts a unix timestamp
 * (seconds), an ISO / zoneless / `"… UTC"` string, or a `Date` — all rendered in
 * UTC via `formatUtc`. Copy writes the canonical Z-ISO (`toIsoString`) so it
 * pastes into explorers / shell tools. Invalid input renders `"—"`.
 */
export function TimestampValue({ value }: { value: TimeInput }) {
  return (
    <CopyableValue value={toIsoString(value)} copyLabel="Copy timestamp">
      <span className="font-mono text-xs tabular-nums">{formatUtc(value)}</span>
    </CopyableValue>
  )
}
