import type { ReactNode } from "react"
import { cn } from "@repo/ui/lib/utils"

/**
 * KeyValueRow — a single label↔value display row for read-views.
 *
 * Geometry & type read directly from Figma "Signal" MetaSheet "Base info" block
 * (file ek2GqtN01smnay542ET3sC, node 695:10123 — rows 695:10132 / 695:10135 / …):
 *   - row:    flex, label left ↔ value right (justify-between), vertically centered
 *   - label:  Funnel Sans Regular 12px (type-caption), black @ opacity-60 → muted
 *   - value:  Funnel Sans Regular 12px (type-caption), black → foreground
 *   - rows in a group separated by an 8px vertical gap (owned by the parent stack,
 *     see KeyValueList)
 *
 * The same muted-label / value pair repeats across MetaSheet, SummaryCard, and
 * detail read-views. Square corners (canon radius=0). The value carries an
 * optional semantic tone; the label is always muted.
 */

export type KeyValueTone = "neutral" | "success" | "destructive" | "warning"

const toneText: Record<KeyValueTone, string> = {
  neutral: "text-foreground",
  success: "text-[var(--success)]",
  destructive: "text-[var(--destructive)]",
  warning: "text-[var(--warning)]",
}

export type KeyValueRowProps = {
  /** Muted left-hand label (always rendered at opacity-60). */
  label: ReactNode
  /** Right-hand value; tone-colored, defaults to --foreground. */
  value: ReactNode
  /** Drives the value color only. */
  tone?: KeyValueTone
  /**
   * Align the value to the start instead of the row end. Useful when the value
   * wraps (long emails, addresses) and right-alignment reads awkwardly.
   */
  align?: "between" | "start"
  className?: string
}

export function KeyValueRow({
  label,
  value,
  tone = "neutral",
  align = "between",
  className,
}: KeyValueRowProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-4",
        align === "between" ? "justify-between" : "justify-start",
        className,
      )}
    >
      <span className="type-caption text-foreground shrink-0 opacity-60">{label}</span>
      <span className={cn("type-caption text-right", toneText[tone])}>{value}</span>
    </div>
  )
}

export type KeyValueItem = {
  label: ReactNode
  value: ReactNode
  tone?: KeyValueTone
}

/**
 * KeyValueList — the repeating unit: a vertical stack of KeyValueRows sharing an
 * 8px gap, matching the Figma "Base info" group (node 695:10131). Pass the rows
 * as data; the list owns the inter-row spacing so callers don't re-derive it.
 */
export function KeyValueList({
  items,
  align = "between",
  className,
}: {
  items: KeyValueItem[]
  align?: KeyValueRowProps["align"]
  className?: string
}) {
  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {items.map((item, i) => (
        <KeyValueRow key={i} label={item.label} value={item.value} tone={item.tone} align={align} />
      ))}
    </div>
  )
}
