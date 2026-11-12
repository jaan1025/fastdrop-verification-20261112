import * as React from "react"

import { cn } from "@repo/ui/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar"

/**
 * AvatarWithName — an avatar paired with a name and optional muted sub-label,
 * laid out inline. The canonical "person cell" that recurs in every table row
 * (e.g. a member list), but equally at home in headers, menus, and cards.
 *
 * Geometry (Figma node 686:26808, read directly from the Team table row):
 *   - 32px circular avatar (default) with the brand initial on a lavender tint,
 *     or a `sm` 24px variant for dense rows.
 *   - 8px gap from avatar to the text column.
 *   - name rendered with type-body-md (Funnel Sans Medium 14/20).
 *   - optional muted sub-label below the name (type-caption, --subtle).
 *
 * Composes the avatar primitive (`@repo/ui/components/avatar`) — it does not
 * re-implement avatar geometry. Pass `src` to show a photo; the `fallback`
 * (typically initials) renders while the image loads or when no `src` is given.
 */
export interface AvatarWithNameProps extends React.ComponentProps<"div"> {
  /** Primary label — the person's display name. */
  name: React.ReactNode
  /** Initials (or other glyph) shown when no image, or while it loads. */
  fallback: React.ReactNode
  /** Optional avatar image URL. Falls back to `fallback` when absent. */
  src?: string
  /** Alt text for the avatar image. Defaults to a string `name`. */
  alt?: string
  /** Optional muted secondary line under the name (e.g. an email or handle). */
  subLabel?: React.ReactNode
  /** Avatar diameter — `default` = 32px, `sm` = 24px for dense rows. */
  size?: "default" | "sm"
}

export function AvatarWithName({
  name,
  fallback,
  src,
  alt,
  subLabel,
  size = "default",
  className,
  ...props
}: AvatarWithNameProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)} {...props}>
      <Avatar size={size}>
        {src ? (
          <AvatarImage src={src} alt={alt ?? (typeof name === "string" ? name : undefined)} />
        ) : null}
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="type-body-md text-foreground/80 truncate">{name}</span>
        {subLabel ? <span className="type-caption text-subtle truncate">{subLabel}</span> : null}
      </div>
    </div>
  )
}
