import * as React from "react"
import { Folder, FileText, Download, Pencil, Trash2, MoreHorizontal } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { Button } from "@repo/ui/components/button"

/**
 * ListRow — file/folder list-view row (Figma Signal node 695:7442).
 * Spec: px-16 py-8, gap-16 between icon and the name/date stack.
 * Folder icon 28px, file icon 24px — both plain near-black (no tint).
 * Name (type-body) sits ABOVE the date/size (type-caption @60%) as a vertical stack.
 * File rows carry an inline action strip (download/edit/delete/more) gap-12, icons 20px.
 * Folder rows show only a three-dot, hidden until hover.
 * Hover bg: rgba(0,0,0,0.03) — square, no border-radius (CANON; Figma's rounded-12
 * default-row dialect is intentionally not adopted).
 */
type ListRowAction = {
  icon: React.ReactNode
  label: string
  destructive?: boolean
  onClick?: () => void
}

type ListRowProps = {
  name: string
  kind?: "file" | "folder"
  meta?: string
  /** When provided, renders the action icon strip (file rows). Omit for folder rows (only 3-dot shown). */
  actions?: {
    onDownload?: () => void
    onEdit?: () => void
    onDelete?: () => void
    onMore?: () => void
  }
  hovered?: boolean
}

function ListRow({ name, kind = "file", meta, actions, hovered = false }: ListRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-4 px-4 py-2 transition-colors",
        hovered ? "bg-[rgba(0,0,0,0.03)]" : "bg-white",
      )}
    >
      {/* Icon + name/date stack */}
      <div className="flex min-w-0 items-center gap-4">
        <div className="text-foreground flex size-7 shrink-0 items-center justify-center">
          {kind === "folder" ? <Folder className="size-7" /> : <FileText className="size-6" />}
        </div>

        <div className="flex min-w-0 flex-col">
          <span className="type-body text-foreground truncate">{name}</span>
          {meta != null && <span className="type-caption truncate text-black/60">{meta}</span>}
        </div>
      </div>

      {/* Actions */}
      {actions != null ? (
        <div className="flex shrink-0 items-center gap-3">
          {actions.onDownload != null && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-foreground/70 hover:text-foreground size-5 rounded-none"
              onClick={actions.onDownload}
              aria-label="Download"
            >
              <Download className="size-5" />
            </Button>
          )}
          {actions.onEdit != null && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-foreground/70 hover:text-foreground size-5 rounded-none"
              onClick={actions.onEdit}
              aria-label="Edit"
            >
              <Pencil className="size-5" />
            </Button>
          )}
          {actions.onDelete != null && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-foreground/70 hover:text-destructive size-5 rounded-none"
              onClick={actions.onDelete}
              aria-label="Delete"
            >
              <Trash2 className="size-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-foreground/70 hover:text-foreground size-5 rounded-none"
            onClick={actions.onMore}
            aria-label="More"
          >
            <MoreHorizontal className="size-5" />
          </Button>
        </div>
      ) : (
        /* folder-style: only 3-dot, hidden until hover */
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-foreground/70 hover:text-foreground invisible size-5 rounded-none group-hover:visible"
          aria-label="More"
        >
          <MoreHorizontal className="size-5" />
        </Button>
      )}
    </div>
  )
}

export { ListRow }
export type { ListRowProps, ListRowAction }
