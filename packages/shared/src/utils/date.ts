import { format, parseISO } from "date-fns"
import { utc } from "@date-fns/utc"

/**
 * The single home for time PARSING and FORMATTING across the monorepo.
 *
 * Conventions (locked):
 *  - Storage / transport / copy → ISO (`toIsoString`, Z-suffixed).
 *  - On-chain / value computation → unix seconds (`toUnixSeconds`).
 *  - Human-readable display → UTC (`formatUtc`); local-with-offset (`formatLocal`)
 *    is for input echoes / cross-checks only.
 *  - Parsing → every form normalizes through `parseUtcDate`, which interprets a
 *    ZONELESS string as UTC (the backend + form-input convention).
 *
 * No other module should call `new Date(string)` / `Date.parse` / `fromUnixTime`
 * / date-fns `format` on a domain timestamp — route it through here.
 */

/** Any wire form a timestamp arrives in. `number` / `bigint` are unix timestamps
 *  (see `parseUtcDate` for the seconds-vs-ms rule); `string` is ISO / zoneless /
 *  `"… UTC[±H]"` / all-digit unix; `Date` is an already-resolved instant. */
export type TimeInput = number | bigint | string | Date

// A numeric timestamp below this is unix SECONDS, at/above it is milliseconds.
// 1e11 seconds ≈ year 5138; 1e11 ms ≈ 1973 — any realistic seconds value
// (~1.7e9) and ms value (~1.7e12) land cleanly on opposite sides.
const MS_THRESHOLD = 1e11

const INVALID = (): Date => new Date(NaN)

function fromEpoch(n: number): Date {
  if (!Number.isFinite(n)) return INVALID()
  return new Date(Math.abs(n) < MS_THRESHOLD ? n * 1000 : n)
}

/** `"+8"` / `"-5"` / `"+5:30"` → an ISO offset `"+08:00"` / `"-05:00"` / `"+05:30"`. */
function utcSuffixToIsoOffset(hh: string, mm: string | undefined): string {
  const sign = hh.startsWith("-") ? "-" : "+"
  const h = Math.abs(parseInt(hh, 10)).toString().padStart(2, "0")
  return `${sign}${h}:${mm ?? "00"}`
}

/**
 * Parse any {@link TimeInput} into a real `Date` instant, UTC-correctly.
 *
 *  - `Date` → a copy of the same instant.
 *  - `number` / `bigint` → unix **seconds** when `|n| < 1e11`, else **ms** (the
 *    same heuristic for both; on-chain values are seconds, ~1.7e9).
 *  - `string`:
 *      • all-digit (optionally signed) → numeric (seconds/ms rule above);
 *      • `"2026-06-30 20:00 UTC+8"` / `"… UTC-5:30"` → parsed with that offset;
 *      • `"2026-06-30 12:00:00 UTC"` → parsed as UTC;
 *      • ends in `Z` or `±hh:mm` → the explicit offset is respected;
 *      • otherwise ZONELESS ISO (`"2026-06-30T11:00"`, `"2026-06-30 11:00:00"`)
 *        → interpreted as **UTC** (date-fns `parseISO` would otherwise read it as
 *        the viewer's local zone — this is the one seam that pins it to UTC).
 *
 * Never throws; an unparseable value yields an `Invalid Date` (callers guard via
 * the formatters, which render `"—"`).
 */
export function parseUtcDate(input: TimeInput): Date {
  // e.g. new Date(1782743397000) → a copy of the same instant.
  if (input instanceof Date) return new Date(input.getTime())
  // e.g. 1782743397n (seconds) / 1782743397000n (ms) — same heuristic as number.
  if (typeof input === "bigint") return fromEpoch(Number(input))
  // e.g. 1782743397 (seconds) / 1782743397000 (ms).
  if (typeof input === "number") return fromEpoch(input)

  const s = input.trim()
  // e.g. "" / "   " → Invalid Date.
  if (s === "") return INVALID()

  // e.g. "1782743397" — a unix timestamp passed as a string (a penalty `beginTime`).
  if (/^[+-]?\d+$/.test(s)) return fromEpoch(Number(s))

  // e.g. "2026-06-30 20:00:00 UTC+8" / "… UTC-5:30" → rewrite the offset to ISO.
  const offsetMatch = s.match(/^(.*?)[ T]?UTC\s*([+-]\d{1,2})(?::(\d{2}))?$/i)
  if (offsetMatch) {
    const [, body, hh, mm] = offsetMatch
    return parseISO(`${body.trim().replace(" ", "T")}${utcSuffixToIsoOffset(hh, mm)}`)
  }

  // e.g. "2026-06-30 12:00:00 UTC" — bare suffix → read the rest as UTC.
  const bareUtc = s.match(/^(.*?)\s*UTC$/i)
  if (bareUtc) {
    return parseISO(bareUtc[1].trim().replace(" ", "T"), { in: utc })
  }

  // e.g. "2026-06-30T12:00:00Z" / "2026-06-30T20:00:00+08:00" — explicit zone,
  // already an absolute instant, respect it.
  if (/(?:Z|[+-]\d{2}:?\d{2})$/.test(s)) return new Date(parseISO(s).getTime())

  // e.g. "2026-06-22T10:26" / "2026-06-22 10:26:00" — zoneless ISO → pin to UTC.
  return new Date(parseISO(s.replace(" ", "T"), { in: utc }).getTime())
}

/** Absolute UTC display: `"2026-06-30 12:00:00 UTC"`. Invalid → `"—"`. The single
 *  human-readable format (display convention = UTC; see file header). */
export function formatUtc(input: TimeInput): string {
  const d = parseUtcDate(input)
  return Number.isNaN(d.getTime()) ? "—" : format(d, "yyyy-MM-dd HH:mm:ss 'UTC'", { in: utc })
}

/** The viewer-local offset as a compact label: `"UTC"`, `"UTC+8"`, `"UTC-5:30"`. */
export function utcOffsetLabel(d: Date): string {
  const minutesEast = -d.getTimezoneOffset()
  if (minutesEast === 0) return "UTC"
  const sign = minutesEast > 0 ? "+" : "-"
  const abs = Math.abs(minutesEast)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`
}

/** Same instant rendered in the VIEWER's local zone with an explicit offset:
 *  `"2026-06-30 20:00:00 UTC+8"`. For input echoes / cross-checks only — the
 *  canonical display is {@link formatUtc}. Invalid → `"—"`. */
export function formatLocal(input: TimeInput): string {
  const d = parseUtcDate(input)
  if (Number.isNaN(d.getTime())) return "—"
  return `${format(d, "yyyy-MM-dd HH:mm:ss")} ${utcOffsetLabel(d)}`
}

/** Canonical Z-suffixed ISO for storage / transport / copy:
 *  `"2026-06-30T12:00:00.000Z"`. Invalid → `""`. */
export function toIsoString(input: TimeInput): string {
  const d = parseUtcDate(input)
  return Number.isNaN(d.getTime()) ? "" : d.toISOString()
}

/** Unix **seconds** for on-chain payloads / value computation. Invalid → `NaN`. */
export function toUnixSeconds(input: TimeInput): number {
  const d = parseUtcDate(input)
  return Number.isNaN(d.getTime()) ? NaN : Math.floor(d.getTime() / 1000)
}
