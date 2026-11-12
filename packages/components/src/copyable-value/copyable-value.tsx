import { type ReactNode } from "react"
import { cn } from "@repo/ui/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip"
import { CopyButton } from "../copy-button"

export interface CopyableValueProps {
  /** The string written to the clipboard on copy. */
  value: string
  /**
   * Optional tooltip content shown on hover. When omitted the children
   * render without a tooltip wrapper.
   */
  tooltip?: ReactNode
  /** Accessible label for the copy button. Defaults to "Copy". */
  copyLabel?: string
  /** Copy icon button size. Defaults to `icon-xs`. */
  copySize?: "icon-xs" | "icon-sm"
  /** Visible representation of the value — usually a `<span>` with `font-mono`. */
  children: ReactNode
  className?: string
}

/**
 * Foundational "short text + tooltip context + copy" composition. Consumed
 * by `<WalletAddress>` (truncated EIP-55 hex) and by inline schedule codes,
 * batch IDs, contract versions — anything that needs the same shape.
 *
 * Pass the rendered display as children — caller owns formatting (truncation,
 * mono, padding, etc.). Pass the underlying string as `value` — that's what
 * hits the clipboard, regardless of display formatting. The copy affordance
 * itself is the shared `<CopyButton>`.
 */
export function CopyableValue({
  value,
  tooltip,
  copyLabel = "Copy",
  copySize = "icon-xs",
  children,
  className,
}: CopyableValueProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        children
      )}
      <CopyButton value={value} copyLabel={copyLabel} size={copySize} />
    </span>
  )
}
