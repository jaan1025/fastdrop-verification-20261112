import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@repo/ui/lib/utils"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@repo/ui/components/input-group"

/**
 * SearchInput — a leading search-icon text input.
 *
 * Composes the input-group primitive with a lucide {@link Search} addon pinned
 * inline-start. Controlled via `value` / `onChange` (onChange receives the raw
 * string, not the event). The recurring "Search by …" control in every toolbar.
 *
 * Spec: Figma node 691:33239. Square (h-9, radius 0), 1px border `--border`,
 * search glyph 16px at left 12px, placeholder text-muted-foreground 14px.
 */
interface SearchInputProps extends Omit<
  React.ComponentProps<"input">,
  "type" | "onChange" | "value"
> {
  /** Controlled value of the search field. */
  value?: string
  /** Fired with the raw input string on every keystroke. */
  onChange?: (value: string) => void
}

function SearchInput({
  className,
  placeholder = "Search",
  value,
  onChange,
  ...props
}: SearchInputProps) {
  return (
    <InputGroup className={cn("h-9", className)}>
      <InputGroupAddon align="inline-start" className="text-muted-foreground">
        <Search aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        {...props}
      />
    </InputGroup>
  )
}

export { SearchInput }
export type { SearchInputProps }
