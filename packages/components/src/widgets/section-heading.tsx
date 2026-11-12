import type { ElementType, ReactNode } from "react"
import { InfoIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip"
import { cn } from "@repo/ui/lib/utils"

export interface SectionHeadingProps {
  children: ReactNode
  /**
   * Optional muted subtitle under the label. Pairs a section title with a
   * subtitle in one component (clique.tech pattern) instead of a hand-rolled
   * `<div><label/><p/></div>` at each call site.
   */
  description?: ReactNode
  /** `destructive` turns the label red (e.g. Danger Zone). */
  variant?: "default" | "destructive"
  /** Red required asterisk after the label — for a sub-group field marker. */
  required?: boolean
  /** Info-icon + tooltip after the label. */
  info?: ReactNode
  /** Optional 1px border-border rule below the row. */
  rule?: boolean
  /** Element for the label (e.g. "h2" for a document heading). Defaults to "span". */
  as?: ElementType
  className?: string
}

/**
 * SectionHeading — the one accent-square section heading.
 *
 * Geometry (Figma node 606:23717, read directly):
 *   - 8×8 solid bg-primary square accent, vertically centered
 *   - label rendered with type-section-label (Funnel Sans Regular 16/24)
 *   - 8px gap square→label
 *   - optional muted `description` subtitle below the label row
 *   - optional 1px border-border rule below
 *
 * Covers three roles that used to be separate components: the page-level
 * section title (`description` for the subtitle, `variant="destructive"` for
 * Danger Zone) and the in-form sub-group marker (`required` asterisk + `info`
 * tooltip). Use `<CardTitle>` (a `@repo/ui` primitive) for a title inside a Card.
 */
export function SectionHeading({
  children,
  description,
  variant = "default",
  required,
  info,
  rule = false,
  as: As = "span",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-0", className)}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "bg-primary size-2 shrink-0",
            variant === "destructive" && "bg-destructive",
          )}
          aria-hidden
        />
        <As className={cn("type-section-label", variant === "destructive" && "text-destructive")}>
          {children}
          {required && <span className="text-destructive"> *</span>}
        </As>
        {info != null && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-default">
                <InfoIcon className="text-muted-foreground size-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent>{info}</TooltipContent>
          </Tooltip>
        )}
      </div>
      {description != null && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      {rule && <div className="border-border mt-3 border-t" />}
    </div>
  )
}
