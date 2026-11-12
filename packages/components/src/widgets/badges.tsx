import type { ReactNode } from "react"
import { cn } from "@repo/ui/lib/utils"

/**
 * StatusPill — dot + label pill (e.g. the top-bar "Engine · live"). h=26, tinted.
 *
 * The role/status → Badge-tone maps that used to live here (RoleBadge / StatusBadge)
 * are NOT design-system components — they are call-site data. They now live in
 * `./domain-tones` as `ROLE_TONES` / `STATUS_TONES`; callers derive a tone from
 * their own domain enum and pass it to the generic `<Badge variant={…}>`.
 */
export function StatusPill({
  tone = "success",
  children,
  className,
}: {
  tone?: "success" | "warning" | "destructive"
  children: ReactNode
  className?: string
}) {
  const dot = { success: "bg-success", warning: "bg-warning", destructive: "bg-destructive" }[tone]
  const skin = {
    success: "bg-success-tint text-success",
    warning: "bg-warning-tint text-warning",
    destructive: "bg-destructive-tint text-destructive",
  }[tone]
  return (
    <span
      className={cn(
        "type-caption inline-flex h-[26px] items-center gap-2 rounded-full px-2.5",
        skin,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot)} aria-hidden />
      {children}
    </span>
  )
}
