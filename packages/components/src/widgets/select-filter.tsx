import type { ReactNode } from "react"

import { cn } from "@repo/ui/lib/utils"
import { NativeSelect, NativeSelectOption } from "@repo/ui/components/native-select"

/**
 * SelectFilter — a compact filter select for list/table toolbars
 * ("All types", "All status", …) with a trailing chevron.
 *
 * Geometry & type read directly from Figma "Signal" Processes toolbar
 * (file ek2GqtN01smnay542ET3sC, nodes 537:840 "All types" / 537:835 "All status"):
 *   - 1px border, square corners (canon radius=0)
 *   - label text — 14px, --foreground; trailing 16px chevron
 *   - compact height (h-9, 36px) matching the adjacent search field
 *
 * Thin composition over the {@link NativeSelect} primitive: it supplies the
 * filter idiom (a non-removable leading "all" sentinel as the placeholder
 * option) plus the toolbar-tuned width, and forwards a normal native-select
 * value/onChange contract. Generic — no domain content.
 */

export type SelectFilterOption = {
  /** The form value submitted when this option is selected. */
  value: string
  /** Visible label; falls back to {@link SelectFilterOption.value}. */
  label?: ReactNode
  /** Render the option as non-selectable. */
  disabled?: boolean
}

export function SelectFilter({
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  size = "sm",
  disabled,
  name,
  id,
  "aria-label": ariaLabel,
  className,
}: {
  /** The selectable filter values (excluding the leading "all" sentinel). */
  options: SelectFilterOption[]
  /** Controlled selected value. Use "" to mean the placeholder sentinel. */
  value?: string
  /** Uncontrolled initial value. */
  defaultValue?: string
  /** Fires with the raw selected string value. */
  onChange?: (value: string) => void
  /**
   * Leading sentinel label (e.g. "All types"). When set, an empty-value option
   * is rendered first so the filter can reset to "show everything".
   */
  placeholder?: ReactNode
  /** Control height: "sm" (h-8) or "default" (h-9). Defaults to "sm". */
  size?: "sm" | "default"
  disabled?: boolean
  name?: string
  id?: string
  "aria-label"?: string
  className?: string
}) {
  return (
    <NativeSelect
      id={id}
      name={name}
      size={size}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => onChange?.(event.currentTarget.value)}
      className={cn("min-w-[7rem]", className)}
    >
      {placeholder != null && <NativeSelectOption value="">{placeholder}</NativeSelectOption>}
      {options.map((option) => (
        <NativeSelectOption key={option.value} value={option.value} disabled={option.disabled}>
          {option.label ?? option.value}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
