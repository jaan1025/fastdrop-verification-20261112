import type { ReactNode } from "react"
import { Check, TriangleAlert, X } from "lucide-react"

import { cn } from "@repo/ui/lib/utils"

/**
 * MatchIndicator — a verify-match glyph with an optional label (Figma "Signal",
 * node 312:3676, the rightmost "Match" column of the Verify comparison table).
 *
 * Three statuses, each a colored Lucide glyph:
 *  - `ok`   — Check, text-success (the two sides agree)
 *  - `warn` — TriangleAlert, text-warning (a soft / borderline delta)
 *  - `fail` — X, text-destructive (a hard mismatch)
 *
 * The per-row indicator of a comparison table: a glyph alone reads as the
 * column cell, and an optional `label` turns it into a standalone status pill
 * (e.g. "Match" / "Review" / "Mismatch"). Content-neutral and de-branded — the
 * caller supplies the label text.
 *
 * Square radius throughout; the glyph carries the only color. Size scales the
 * icon; the optional label rides at type-caption beside it.
 */

type MatchStatus = "ok" | "warn" | "fail"

type MatchIndicatorProps = {
  /** Which match outcome to render. */
  status: MatchStatus
  /** Optional trailing label (Funnel Sans, type-caption). Omit for a bare glyph. */
  label?: ReactNode
  /** Glyph edge length. Defaults to `md` (16px); `lg` is the 24px table size. */
  size?: "sm" | "md" | "lg"
  className?: string
}

const STATUS_GLYPH = {
  ok: Check,
  warn: TriangleAlert,
  fail: X,
} as const

const STATUS_COLOR: Record<MatchStatus, string> = {
  ok: "text-success",
  warn: "text-warning",
  fail: "text-destructive",
}

/** Screen-reader fallback when no visible label is supplied. */
const STATUS_SR: Record<MatchStatus, string> = {
  ok: "Match",
  warn: "Review",
  fail: "Mismatch",
}

const ICON_SIZE: Record<NonNullable<MatchIndicatorProps["size"]>, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-6",
}

function MatchIndicator({ status, label, size = "md", className }: MatchIndicatorProps) {
  const Glyph = STATUS_GLYPH[status]
  return (
    <span
      data-slot="match-indicator"
      data-status={status}
      className={cn("inline-flex items-center gap-1.5", STATUS_COLOR[status], className)}
    >
      <Glyph className={cn("shrink-0", ICON_SIZE[size])} strokeWidth={2.25} aria-hidden />
      {label != null ? (
        <span className="type-caption">{label}</span>
      ) : (
        <span className="sr-only">{STATUS_SR[status]}</span>
      )}
    </span>
  )
}

export { MatchIndicator }
export type { MatchIndicatorProps, MatchStatus }
