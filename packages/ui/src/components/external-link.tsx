import type { ReactNode } from "react"
import { ExternalLinkIcon } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { cn } from "@repo/ui/lib/utils"

export interface ExternalLinkProps {
  href: string
  children: ReactNode
  /** Hide the trailing "opens in new tab" glyph. */
  hideIcon?: boolean
  className?: string
}

/**
 * Generic external link rendered as a compact link-variant button with a
 * trailing "opens in new tab" glyph. Inline-sized (`h-auto p-0`) so it sits
 * flush next to body text. Always opens in a new tab with `rel="noreferrer"`.
 * Domain-free — the caller supplies the label as children.
 */
export function ExternalLink({ href, children, hideIcon, className }: ExternalLinkProps) {
  return (
    <Button asChild variant="link" size="sm" className={cn("h-auto gap-1 p-0", className)}>
      <a href={href} target="_blank" rel="noreferrer">
        {children}
        {!hideIcon && <ExternalLinkIcon className="size-3" />}
      </a>
    </Button>
  )
}
