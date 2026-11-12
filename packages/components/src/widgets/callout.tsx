import type { ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { Alert, AlertTitle, AlertDescription } from "@repo/ui/components/alert"
import { cn } from "@repo/ui/lib/utils"

/**
 * Callout — a compact note / alert block: an optional leading icon, an optional
 * bold title, and body text, on a square tonal-tint background. A thin semantic
 * skin over the `alert` primitive (`@repo/ui/components/alert`), narrowed to the one
 * recurring shape in the Signal surfaces: the grey "Note:" block and the red
 * danger warning that sit inside DangerConfirm modals and wizard notices.
 *
 * Geometry & tone read from Figma "Signal" DangerConfirm modal
 * (file ek2GqtN01smnay542ET3sC):
 *   - neutral note  — node 691:33419 — bg `--surface-info` (#f5f7fb), 12px body
 *     at 60% opacity ("Note:" + lines), Funnel Sans 12/18
 *   - danger        — node 691:33421 — bg `--destructive-tint` (#dd3535 @ 15%),
 *     text `--destructive`, Funnel Sans 12/18
 *   - warning-amber — same 15%-tint idiom on `--warning` (FIGMA-IMMERSION F7;
 *     amber "Treat as input, not truth." wizard notice)
 *
 * Both Figma instances are p-8 (8px) with `items-start` and no border. The
 * leading icon is optional (the modal blocks render text-only; wizard notices
 * carry a glyph) and renders at size-4, tinted to the tone's accent.
 *
 * Square corners (canon radius=0). Neutral / de-branded: callers pass their own
 * copy, icon, and tone. No business / "Signal" content.
 */

const calloutVariants = cva(
  "flex items-start gap-2 border-0 p-2 [&>svg]:size-4 [&>svg]:translate-y-px",
  {
    variants: {
      tone: {
        /** Grey informational note — the default "Note:" block. */
        neutral: "text-foreground/60 [&>svg]:text-subtle bg-[var(--surface-info)]",
        /** Amber caution — non-blocking advisory ("treat as input, not truth"). */
        warning: "text-warning [&>svg]:text-warning bg-[var(--warning-tint)]",
        /** Red danger — destructive / irreversible consequences. */
        danger: "text-destructive [&>svg]:text-destructive bg-[var(--destructive-tint)]",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
)

export type CalloutTone = NonNullable<VariantProps<typeof calloutVariants>["tone"]>

export type CalloutProps = {
  /** Tonal skin — `neutral` (grey) · `warning` (amber) · `danger` (red). */
  tone?: CalloutTone
  /** Optional leading icon (e.g. a lucide glyph), rendered at size-4. */
  icon?: ReactNode
  /** Optional bold title line above the body (Funnel Sans 12/18, medium). */
  title?: ReactNode
  /** Body text. Required — the message itself. */
  children: ReactNode
  /** Merged onto the root alert block. */
  className?: string
}

export function Callout({ tone, icon, title, children, className }: CalloutProps) {
  return (
    <Alert className={cn(calloutVariants({ tone }), className)}>
      {icon}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title != null && (
          <AlertTitle className="type-caption-md line-clamp-none min-h-0">{title}</AlertTitle>
        )}
        <AlertDescription className="type-caption leading-[18px] text-current [&_p]:leading-[18px]">
          {children}
        </AlertDescription>
      </div>
    </Alert>
  )
}
