import * as React from "react"
import { cn } from "@repo/ui/lib/utils"

/**
 * NavItem — a sidebar navigation row.
 *
 * Layout (Figma 803:10758): a 32px-tall row, `px-2` (8px), leading icon
 * (`size-4`) + label (`type-body`, Funnel Sans 14/20) with an 8px gap, and an
 * optional trailing count badge (or arbitrary `trailing` content).
 *
 * Active state is driven by the `data-status` attribute, so the row works with
 * BOTH usage modes off one CSS path:
 * - product use — pass the boolean `active` prop (e.g. AppSidebar); it sets
 *   `data-status="active"`.
 * - router use — wrap with TanStack `createLink(NavItem)`; the router injects
 *   `data-status="active"` on the matched route automatically.
 *
 * States:
 * - default — `text-foreground`, transparent; hover tints with `--hover-neutral`
 *   (5% black neutral hover).
 * - active — solid black row (`bg-foreground`) + white label (CANON: the active
 *   nav row is solid black, never a tint).
 *
 * The count badge is a SQUARE tonal chip (`size-5`, `--primary-tint` background,
 * `text-primary`, `type-caption-md`). On an active (black) row it inverts to a
 * translucent-white chip so it stays legible. Square per design-system CANON —
 * nav counts are not pills.
 *
 * Renders as a `<button>` by default; pass `as="a"` (with `href`, or via
 * `createLink`) to render an anchor for real navigation. forwardRef so the
 * router can attach its link ref. The repeating unit composed by AppSidebar.
 */
type NavItemBaseProps = {
  /** Leading icon. Sized to `size-4` by the row; pass a raw icon element. */
  icon?: React.ReactNode
  /** Row label. */
  label: React.ReactNode
  /** Optional trailing count; renders the tonal badge when not nullish. */
  count?: number | string
  /** Arbitrary trailing content rendered after the label/count (e.g. a status dot). */
  trailing?: React.ReactNode
  /**
   * Active = solid black row with white text. Omit when the row is driven by a
   * router link (`createLink` supplies `data-status` instead).
   */
  active?: boolean
  className?: string
}

type NavItemButtonProps = NavItemBaseProps &
  Omit<React.ComponentPropsWithoutRef<"button">, keyof NavItemBaseProps | "children"> & {
    as?: "button"
  }

type NavItemAnchorProps = NavItemBaseProps &
  Omit<React.ComponentPropsWithoutRef<"a">, keyof NavItemBaseProps | "children"> & {
    as: "a"
  }

type NavItemProps = NavItemButtonProps | NavItemAnchorProps

const NavItem = React.forwardRef<HTMLElement, NavItemProps>(function NavItem(props, ref) {
  const { icon, label, count, trailing, active, className, as = "button", ...rest } = props

  const rowClass = cn(
    "group type-body text-foreground flex h-8 w-full items-center gap-2 px-2 text-left transition-colors hover:bg-[var(--hover-neutral)]",
    "data-[status=active]:bg-foreground data-[status=active]:text-background data-[status=active]:hover:bg-foreground",
    className,
  )

  const content = (
    <>
      {icon != null && (
        <span className="grid size-4 shrink-0 place-items-center [&_svg]:size-4">{icon}</span>
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count != null && (
        <span className="type-caption-md bg-primary-tint text-primary group-data-[status=active]:text-background grid size-5 shrink-0 place-items-center group-data-[status=active]:bg-[rgb(255_255_255/_0.15)]">
          {count}
        </span>
      )}
      {trailing}
    </>
  )

  // The boolean `active` prop (product use, e.g. AppSidebar) drives `data-status`
  // directly. When omitted, the attribute is left to the router (createLink).
  const statusProps =
    active === undefined ? undefined : { "data-status": active ? "active" : "inactive" }

  if (as === "a") {
    const anchorRest = rest as React.ComponentPropsWithoutRef<"a">
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={rowClass}
        aria-current={active ? "page" : undefined}
        {...anchorRest}
        {...statusProps}
      >
        {content}
      </a>
    )
  }

  const buttonRest = rest as React.ComponentPropsWithoutRef<"button">
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      className={rowClass}
      aria-current={active ? "page" : undefined}
      {...buttonRest}
      {...statusProps}
    >
      {content}
    </button>
  )
})

export { NavItem }
export type { NavItemProps }
