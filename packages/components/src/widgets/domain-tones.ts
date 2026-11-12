import type { BadgeVariant } from "@repo/ui/components/badge"

/**
 * Example domain → Badge-tone maps. These are TEMPLATE / call-site DATA, not
 * design-system components. They demonstrate how a product derives a `Badge`
 * tone from its own domain enum and passes it to the generic
 * `<Badge tone={ROLE_TONES[role]}>`. The DS ships only `Badge` (tones) +
 * `StatusPill`; the business maps live here as reference data, never as a
 * `RoleBadge`/`StatusBadge` component.
 */
export const ROLE_TONES: Record<string, BadgeVariant> = {
  administrator: "primary",
  "decision-maker": "success",
  member: "member",
  viewer: "neutral",
}

export const ROLE_LABELS: Record<string, string> = {
  administrator: "Administrator",
  "decision-maker": "Decision-Maker",
  member: "Member",
  viewer: "Viewer",
}

export const STATUS_TONES: Record<string, BadgeVariant> = {
  complete: "success",
  incomplete: "warning",
}
