import type { ReactNode } from "react"

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@repo/ui/components/empty"
import { Button } from "@repo/ui/components/button"
import { cn } from "@repo/ui/lib/utils"

/**
 * EmptyState — a centered zero-data block: optional icon, title, subtitle,
 * and a single CTA button. A semantic skin over the `empty` primitive
 * (`@repo/ui/components/empty`), narrowed to the one recurring shape in the
 * Signal surfaces: empty folders / no-org / no-results.
 *
 * Geometry & type read from Figma "Signal" Documents screen
 * (file ek2GqtN01smnay542ET3sC, node 694:6351 — "No items found / This folder
 * is empty" + black "New Folder" CTA):
 *   - vertical stack, centered, gap-4 (16px)
 *   - header text block: title → 8px gap → subtitle, centered
 *   - title    — Funnel Display 20/28 (type-display-2)
 *   - subtitle — Funnel Sans 14px, muted-foreground
 *   - CTA      — single button; default `commit` (BLACK) per Figma + canon
 *
 * Square corners (canon radius=0). Neutral / de-branded: callers pass their
 * own copy, icon, and action. The optional icon renders in a square icon-chip
 * (--radius-icon) via the primitive's `EmptyMedia variant="icon"`.
 */

export type EmptyStateAction = {
  /** Button label. */
  label: ReactNode
  /** Click handler. */
  onClick?: () => void
  /** Optional leading icon, rendered at size-4 inside the button. */
  icon?: ReactNode
  /** Button intent — defaults to `commit` (black) per the Figma source. */
  variant?: React.ComponentProps<typeof Button>["variant"]
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  /** Headline (type-display-2). Required. */
  title: ReactNode
  /** Muted supporting line below the title. */
  description?: ReactNode
  /** Optional icon shown in a square icon-chip above the title. */
  icon?: ReactNode
  /** Single CTA. Omit for a display-only empty block. */
  action?: EmptyStateAction
  className?: string
}) {
  return (
    <Empty className={cn("border-none", className)}>
      <EmptyHeader>
        {icon != null && <EmptyMedia variant="icon">{icon}</EmptyMedia>}
        <EmptyTitle>{title}</EmptyTitle>
        {description != null && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action != null && (
        <EmptyContent>
          <Button variant={action.variant ?? "commit"} onClick={action.onClick} className="w-50">
            {action.icon}
            {action.label}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}
