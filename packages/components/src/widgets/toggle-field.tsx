import { useId, type ReactNode } from "react"

import { Switch } from "@repo/ui/components/switch"
import { cn } from "@repo/ui/lib/utils"

/**
 * ToggleField — a labeled on/off control: a square Switch paired with a label
 * and optional helper text.
 *
 * Composes the `Switch` primitive (square track 38×20, white thumb, ON =
 * brand `--primary`) with a label/helper text block. Controlled-only:
 * pass `checked` + `onCheckedChange`. Recurs in wizard / detail screens as the
 * "feature has been enabled" row.
 *
 * Figma source (node 727:5562 — "Foundation has been set up", ON state):
 *   - 38×20 track, 16×16 thumb pushed right; track fill = brand blue.
 *   - 15px gap from the control to the label.
 *   - label rendered at type-body (Funnel Sans 14), helper at type-caption.
 * The Figma instance places the control to the LEFT of the label, so
 * `control` defaults to `"start"`.
 *
 * Square by design — never rounded (CANON: radius=0; Switch keeps its own
 * deliberate square shape).
 */
export function ToggleField({
  label,
  helperText,
  checked,
  onCheckedChange,
  disabled,
  control = "start",
  id,
  className,
}: {
  /** The control's label. Clicking it toggles the switch (htmlFor binding). */
  label: ReactNode
  /** Optional secondary line below the label (type-caption, muted). */
  helperText?: ReactNode
  /** Controlled on/off state. */
  checked: boolean
  /** Fired with the next state when the user toggles the switch. */
  onCheckedChange: (checked: boolean) => void
  /** Disable the control and dim the row. */
  disabled?: boolean
  /**
   * Where the switch sits relative to the label.
   * - `"start"` (default, Figma): switch left, label right — compact rows.
   * - `"end"`: label left, switch pushed to the right edge — settings lists.
   */
  control?: "start" | "end"
  /** Explicit id for the switch; auto-generated when omitted. */
  id?: string
  /** Merged onto the root wrapper. */
  className?: string
}) {
  const generatedId = useId()
  const switchId = id ?? generatedId

  const switchEl = (
    <Switch id={switchId} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
  )

  const labelEl = (
    <label
      htmlFor={switchId}
      className={cn(
        "flex min-w-0 flex-col gap-0.5 select-none",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
      )}
    >
      <span className="type-body text-foreground">{label}</span>
      {helperText ? <span className="type-caption text-subtle">{helperText}</span> : null}
    </label>
  )

  return (
    <div
      data-slot="toggle-field"
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "flex items-start gap-3",
        control === "end" && "justify-between",
        disabled && "opacity-50",
        className,
      )}
    >
      {control === "start" ? (
        <>
          {/* Nudge the switch to sit on the label's first text line. */}
          <span className="flex shrink-0 items-center pt-0.5">{switchEl}</span>
          {labelEl}
        </>
      ) : (
        <>
          {labelEl}
          <span className="flex shrink-0 items-center pt-0.5">{switchEl}</span>
        </>
      )}
    </div>
  )
}
