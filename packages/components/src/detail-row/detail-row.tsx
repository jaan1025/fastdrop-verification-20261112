import type { ReactNode } from "react"
import { cn } from "@repo/ui/lib/utils"
import { CopyButton } from "../copy-button"

export function DetailRow({
  label,
  value,
  mono,
  copyValue,
  className,
}: {
  label: ReactNode
  value: ReactNode
  mono?: boolean
  /** When set, renders a copy button that writes this string to the clipboard. */
  copyValue?: string
  className?: string
}) {
  return (
    <div className={cn("flex items-start gap-4 py-2 text-sm", className)}>
      {/* Label never wraps — it's a short fixed key; the value side flexes. */}
      <span className="text-muted-foreground shrink-0 whitespace-nowrap">{label}</span>
      <div className="flex min-w-0 flex-1 items-start justify-end gap-1">
        {/* Value wraps (long hashes break); the copy button stays fixed. */}
        <span className={cn("min-w-0 text-right break-words", mono ? "font-mono" : "")}>
          {value}
        </span>
        {copyValue !== undefined && <CopyButton value={copyValue} className="shrink-0" />}
      </div>
    </div>
  )
}

/**
 * Unified container for a vertical run of `<DetailRow>`s. Bakes in the shared
 * spacing (and optional hairline separators) so every detail group across the
 * app reads with the same rhythm — instead of each consumer reaching for an
 * ad-hoc `space-y-*` or `divide-y` wrapper. Lives alongside `DetailRow` since
 * the two are always used together.
 *
 * @example
 * <DetailList>
 *   <DetailRow label="Schedule" value={…} />
 *   <DetailRow label="Audience" value={…} />
 * </DetailList>
 */
export function DetailList({
  children,
  divided = true,
  className,
}: {
  children: ReactNode
  /** Hairline separators between rows. Defaults to `true`. */
  divided?: boolean
  className?: string
}) {
  return <div className={cn(divided && "divide-border divide-y", className)}>{children}</div>
}
