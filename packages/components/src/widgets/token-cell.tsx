import * as React from "react"

import { cn } from "@repo/ui/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar"

/**
 * TokenCell — a token logo paired with its name, ticker, and an optional muted
 * sub-label, laid out inline. The canonical "token cell" that recurs as the
 * first column of every Processes / Home table row, and equally at home in
 * recommendation cards and pickers.
 *
 * Geometry (Figma nodes 528:341 table row + 239:10185 recommendation card):
 *   - circular token logo (default 32px, `sm` 24px for dense rows). Circular is
 *     the design canon for token marks — the Avatar primitive supplies the
 *     rounded-full geometry, so this widget never re-derives it.
 *   - 8px gap from the logo to the text column.
 *   - name (type-body-md, Funnel Sans Medium 14/20, --foreground/80) and ticker
 *     (type-caption, Funnel Sans Regular 12/16, --subtle) sit inline on one row,
 *     8px apart.
 *   - optional muted sub-label below the name/ticker row (type-caption, --subtle),
 *     e.g. "Listing — Tier 2 spot".
 *
 * Sibling of AvatarWithName (the "person cell"): same composition idiom over the
 * avatar primitive, specialised for a token's name + ticker pairing.
 */
export interface TokenCellProps extends React.ComponentProps<"div"> {
  /** Token display name, e.g. "Zenith Protocol". */
  name: React.ReactNode
  /** Token ticker symbol, e.g. "ZNX". Rendered muted, inline after the name. */
  ticker?: React.ReactNode
  /** Initials (or other glyph) shown when no logo, or while it loads. */
  fallback: React.ReactNode
  /** Optional token logo image URL. Falls back to `fallback` when absent. */
  src?: string
  /** Alt text for the logo image. Defaults to a string `name`. */
  alt?: string
  /** Optional muted secondary line below the name (e.g. "Listing — Tier 2 spot"). */
  subLabel?: React.ReactNode
  /** Logo diameter — `default` = 32px, `sm` = 24px for dense rows. */
  size?: "default" | "sm"
}

export function TokenCell({
  name,
  ticker,
  fallback,
  src,
  alt,
  subLabel,
  size = "default",
  className,
  ...props
}: TokenCellProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)} {...props}>
      <Avatar size={size}>
        {src ? (
          <AvatarImage
            src={src}
            alt={alt ?? (typeof name === "string" ? name : undefined)}
            className="object-cover"
          />
        ) : null}
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="flex min-w-0 items-center gap-2">
          <span className="type-body-md text-foreground/80 truncate">{name}</span>
          {ticker ? <span className="type-caption text-subtle shrink-0">{ticker}</span> : null}
        </span>
        {subLabel ? <span className="type-caption text-subtle truncate">{subLabel}</span> : null}
      </div>
    </div>
  )
}
