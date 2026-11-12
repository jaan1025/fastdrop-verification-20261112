import { FileText, Download, X } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"

/**
 * FileAttachmentChip — inline file attachment row.
 *
 * Figma "Signal" provenance: node 606:23740 (Brand kit) / 606:23853 (Audits)
 * on the Process detail · Project Context screen (606:23648).
 *
 * Spec: bg rgba(0,0,0,0.03), square. Leading 32×32 lavender-tint (--primary-tint)
 * square icon badge holding a 20px file glyph. Name (type-body, 14/Regular) over
 * size (12px, foreground @60%). Trailing 20px download icon (when onDownload) and
 * × (when onRemove) — bare icons, no button chrome. Row is justify-between full-width.
 */
type FileAttachmentChipProps = {
  name: string
  size: string
  onRemove?: () => void
  onDownload?: () => void
  className?: string
}

function FileAttachmentChip({
  name,
  size,
  onRemove,
  onDownload,
  className,
}: FileAttachmentChipProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2 bg-[var(--surface-subtle)] px-3 py-3",
        className,
      )}
    >
      {/* Leading icon badge + name/size */}
      <div className="flex min-w-0 items-center gap-[9px]">
        <div className="bg-primary-tint grid size-8 shrink-0 place-items-center">
          <FileText className="text-primary size-5" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="type-body text-foreground truncate">{name}</span>
          <span className="text-foreground/60 text-[12px] leading-none">{size}</span>
        </div>
      </div>

      {/* Trailing actions — bare 20px icons */}
      <div className="flex shrink-0 items-center gap-3">
        {onDownload != null && (
          <button
            type="button"
            onClick={onDownload}
            aria-label="Download"
            className="text-foreground hover:text-primary grid size-5 place-items-center transition-colors"
          >
            <Download className="size-5" />
          </button>
        )}
        {onRemove != null && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove"
            className="text-foreground hover:text-destructive grid size-5 place-items-center transition-colors"
          >
            <X className="size-5" />
          </button>
        )}
      </div>
    </div>
  )
}

export { FileAttachmentChip }
export type { FileAttachmentChipProps }
