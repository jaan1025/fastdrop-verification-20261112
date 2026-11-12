import type { ReactNode } from "react"
import { cn } from "@repo/ui/lib/utils"

/**
 * StatCard — a single stat block (the StatStrip cell).
 *
 * Geometry & type read directly from Figma "Signal" Intake-overview strip
 * (file ek2GqtN01smnay542ET3sC, node 537:806 / cells 537:806, 537:812, 537:818;
 * tone number node 546:1615):
 *   - label     — Funnel Sans 14px, leading-16, capitalize, tracking 0.3px, muted
 *   - value     — Funnel Display Medium 24/32 (type-display-1), tone-colored,
 *                 with optional inline `secondary` (e.g. "/ 1,000") + `unit`
 *   - caption   — Funnel Sans 12px, leading-16, capitalize, tracking 0.3px, muted
 *   - vertical stack: label → 12px gap → (value → 4px gap → caption)
 *
 * Square corners (canon radius=0). The number is the only tone-bearing element:
 *   neutral → --foreground, positive → --success-bright, warn → --warning.
 */

export type StatTone = "neutral" | "positive" | "warn"

const toneText: Record<StatTone, string> = {
  neutral: "text-[var(--foreground)]",
  positive: "text-[var(--success-bright)]",
  warn: "text-[var(--warning)]",
}

export interface StatCardProps {
  /** Small capitalized label above the number. */
  label: ReactNode
  /** The headline figure — big Funnel-Display number. */
  value: ReactNode
  /** Muted text inline after the value, e.g. a "/ 1,000 (9.8%)" denominator. */
  secondary?: ReactNode
  /** Muted text inline after the value, e.g. a token symbol. */
  unit?: ReactNode
  /** Optional sub-label rendered below the number. */
  caption?: ReactNode
  /** Drives the number color only. */
  tone?: StatTone
  /** Wrap in a 1px token border with padding (default true). */
  bordered?: boolean
  className?: string
}

export function StatCard({
  label,
  value,
  secondary,
  unit,
  caption,
  tone = "neutral",
  bordered = true,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3",
        bordered && "border-border bg-background border p-6",
        className,
      )}
    >
      <span className="type-body text-muted-foreground leading-4 tracking-[0.3px] capitalize">
        {label}
      </span>
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-baseline gap-2">
          <span className={cn("type-display-1", toneText[tone])}>{value}</span>
          {secondary != null && (
            <span className="text-muted-foreground text-sm tabular-nums">{secondary}</span>
          )}
          {unit != null && <span className="text-muted-foreground text-xs">{unit}</span>}
        </div>
        {caption != null && (
          <span className="type-caption text-muted-foreground tracking-[0.3px] capitalize">
            {caption}
          </span>
        )}
      </div>
    </div>
  )
}

export type StatItem = {
  label: ReactNode
  value: ReactNode
  secondary?: ReactNode
  unit?: ReactNode
  caption?: ReactNode
  tone?: StatTone
}

function StatStripCell({ item, className }: { item: StatItem; className?: string }) {
  return (
    <StatCard
      label={item.label}
      value={item.value}
      secondary={item.secondary}
      unit={item.unit}
      caption={item.caption}
      tone={item.tone}
      bordered={false}
      className={cn("p-6", className)}
    />
  )
}

/**
 * StatStrip — the headline-metrics unit: StatCards sharing one outer border,
 * divided by 1px token rules (collapsed borders, square corners per canon).
 * Read directly from the Figma "Signal" Intake-overview strip (node 537:806;
 * tone number 546:1615).
 *
 * Layout:
 *   - default → a single equal-width row (cards stretch, `min-w` floor)
 *   - `responsive` → the shared container-query column ladder
 *     (`@lg:2 · @4xl:3 · @7xl:4`), for headline rows with many stats. Use it as
 *     the drop-in for a page's top-of-page metric grid.
 */
export function StatStrip({
  items,
  responsive = false,
  className,
}: {
  items: StatItem[]
  responsive?: boolean
  className?: string
}) {
  if (responsive) {
    // Fits-in-one-row → a single full-width row (the Figma "Signal" strip); wraps
    // to new rows ONLY when the cells can no longer hold their min width. `auto-fit`
    // collapses would-be-empty tracks, so any item count fills the full width with
    // no empty trailing column. Same border model as the single-row strip — a
    // container top/left border + per-cell right/bottom borders — collapsing to 1px
    // dividers while keeping the full four-sided outer frame.
    return (
      <div
        className={cn(
          "border-border bg-background grid w-full grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] border-t border-l",
          className,
        )}
      >
        {items.map((item, i) => (
          <StatStripCell key={i} item={item} className="border-border border-r border-b" />
        ))}
      </div>
    )
  }
  return (
    <div
      className={cn(
        "border-border bg-background flex w-full items-stretch border-t border-l",
        className,
      )}
    >
      {items.map((item, i) => (
        <StatStripCell
          key={i}
          item={item}
          className="border-border min-w-[140px] flex-1 border-r border-b"
        />
      ))}
    </div>
  )
}
