import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card"
import { cn } from "@repo/ui/lib/utils"

export interface DataPanelProps {
  /** Omit for the title-less variant (modal context blocks) — the header is dropped entirely. */
  title?: ReactNode
  children: ReactNode
  /** Extra classes for the outer container (e.g. grid spans). */
  className?: string
}

/**
 * Borderless tinted container with an optional title and a content area.
 * Use for tier-3 "supporting detail" sections (Schedule, Timeline,
 * Identity, etc.) where the standard bordered `Card` feels too heavy. Pair
 * with the regular bordered `Card` (or `StatCard`) for tier-1 headline
 * metrics — the contrast carries the page hierarchy. Inside modals, omit
 * `title`: the dialog header already names the action, so the context
 * block is just the tinted body.
 *
 * If the children are a vertical list of `DetailRow`s, wrap them in a
 * `<DetailList>` (from `../detail-row`) — the canonical run-of-rows container
 * that bakes in the shared spacing and optional hairline separators, so
 * callers stop reinventing `space-y-*` / `divide-y` by hand.
 */
export function DataPanel({ title, children, className }: DataPanelProps) {
  return (
    <Card className={cn("bg-muted/40 border-0", className)}>
      {title != null && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  )
}
