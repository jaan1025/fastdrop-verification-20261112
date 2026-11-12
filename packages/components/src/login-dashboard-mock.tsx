import { cn } from "@repo/ui/lib/utils"

/**
 * LoginDashboardMock — a small, data-driven light-dashboard mock for the login
 * brand panel (02-auth.md § Right brand panel). Replaces the frosted placeholder
 * stack with something that reads like a real product screen: top bar + sidebar
 * nav + KPI cards + a primary table. The chrome is fixed (one coherent product
 * family); each app passes its OWN domain vocabulary (nav labels, page heading,
 * KPI labels, table columns + rows) so the preview resembles that specific app.
 *
 * Rendered inside the floating front layer of `AuthSplitPanel` (≈692×514, clipped
 * by overflow-hidden). Uses design-system tokens, so it inherits each app's theme.
 */
export interface LoginDashboardMockProps {
  /** Product name shown in the sidebar header. */
  productName?: string
  /** Sidebar nav labels in order; mark the home/overview item `active`. */
  nav?: { label: string; active?: boolean }[]
  /** Primary dashboard page title. */
  heading?: string
  /** KPI stat cards (3–4). */
  kpis?: { label: string; value: string }[]
  /** Primary table column headers. */
  columns?: string[]
  /** Primary table rows — each a list of cell strings aligned to `columns`. */
  rows?: string[][]
  /** Render the last column's cells as accent status pills. Default true. */
  pillLastColumn?: boolean
  className?: string
}

const GENERIC_NAV = [
  { label: "Overview", active: true },
  { label: "Reports" },
  { label: "Activity" },
  { label: "Team" },
  { label: "Settings" },
]
const GENERIC_KPIS = [
  { label: "Total", value: "1,248" },
  { label: "Active", value: "312" },
  { label: "Pending", value: "27" },
]
const GENERIC_COLUMNS = ["Name", "Category", "Amount", "Status"]
const GENERIC_ROWS = [
  ["Alpha", "Type A", "12,500", "Active"],
  ["Bravo", "Type B", "8,200", "Pending"],
  ["Charlie", "Type A", "5,750", "Active"],
  ["Delta", "Type C", "3,100", "Review"],
]

export function LoginDashboardMock({
  productName = "Acme",
  nav = GENERIC_NAV,
  heading = "Overview",
  kpis = GENERIC_KPIS,
  columns = GENERIC_COLUMNS,
  rows = GENERIC_ROWS,
  pillLastColumn = true,
  className,
}: LoginDashboardMockProps) {
  const cols = { gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }
  return (
    <div className={cn("flex h-full w-full bg-white text-[#0a0a0a] select-none", className)}>
      {/* Sidebar */}
      <aside className="border-border/70 flex w-[150px] shrink-0 flex-col gap-0.5 border-r p-3">
        <div className="mb-2 flex items-center gap-1.5 px-1">
          <span className="bg-primary size-4 shrink-0" />
          <span className="truncate text-[11px] font-semibold">{productName}</span>
        </div>
        {nav.map((n, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 text-[11px]",
              n.active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                n.active ? "bg-primary" : "bg-muted-foreground/40",
              )}
            />
            <span className="truncate">{n.label}</span>
          </div>
        ))}
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div className="border-border/70 flex h-9 shrink-0 items-center justify-between border-b px-4">
          <span className="text-muted-foreground text-[11px]">Dashboard</span>
          <div className="flex items-center gap-1.5">
            <span className="bg-muted size-4 rounded-full" />
            <span className="bg-primary/80 size-4 rounded-full" />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <span className="text-sm font-semibold">{heading}</span>

          {/* KPI cards */}
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${kpis.length}, minmax(0,1fr))` }}
          >
            {kpis.map((k, i) => (
              <div key={i} className="border-border/70 border p-2">
                <div className="text-muted-foreground truncate text-[9px] tracking-wide uppercase">
                  {k.label}
                </div>
                <div className="mt-0.5 truncate text-sm font-semibold">{k.value}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="border-border/70 overflow-hidden border">
            <div className="bg-muted/40 grid px-3 py-1.5" style={cols}>
              {columns.map((c, i) => (
                <div
                  key={i}
                  className="text-muted-foreground truncate text-[9px] tracking-wide uppercase"
                >
                  {c}
                </div>
              ))}
            </div>
            {rows.map((r, ri) => (
              <div
                key={ri}
                className="border-border/60 grid items-center border-t px-3 py-1.5"
                style={cols}
              >
                {r.map((cell, ci) => {
                  const isPill = pillLastColumn && ci === columns.length - 1
                  return (
                    <div key={ci} className="truncate text-[11px]">
                      {isPill ? (
                        <span className="bg-primary/10 text-primary inline-flex px-1.5 py-0.5 text-[9px] font-medium">
                          {cell}
                        </span>
                      ) : (
                        cell
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
