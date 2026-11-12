import { FileText, X } from "lucide-react"
import { Progress } from "@repo/ui/components/progress"
import { Badge } from "@repo/ui/components/badge"
import { cn } from "@repo/ui/lib/utils"

/**
 * FileUploadRow — an in-progress upload row.
 *
 * A file being uploaded (or waiting in the queue), as distinct from
 * {@link FileAttachmentChip} which represents a *settled* file. From the
 * pipeline / intake upload lists.
 *
 * Figma "Signal" provenance: the intake-wizard CSV upload section (screen
 * 736:9311) — the dropzone (736:9480) and the settled file chip (736:9556).
 * This row is the transient state between them: same leading 32×32 lavender-tint
 * (--primary-tint) square holding a 20px file glyph, name + meta, trailing × —
 * but the meta line is replaced by an upload-progress affordance.
 *
 * Two mutually-exclusive states (driven by `status`):
 *   - "queued"     → a neutral "Queued" chip in place of the progress bar.
 *   - "uploading"  → a thin progress bar (h-1.5, rounded-full) + percent label.
 *
 * Square container (bg --surface), token classes, type-* utilities throughout.
 */
type FileUploadRowStatus = "queued" | "uploading"

type FileUploadRowProps = {
  /** File name, e.g. "allocations.csv". Truncates when narrow. */
  name: string
  /** Human-readable size, e.g. "1.2 MB". Optional. */
  size?: string
  /** Upload phase. "queued" shows a chip; "uploading" shows the progress bar. */
  status?: FileUploadRowStatus
  /** Upload progress 0–100. Only used when status === "uploading". */
  progress?: number
  /** Label shown on the queued chip. Default "Queued". */
  queuedLabel?: string
  /** Cancel / remove the upload. Renders the trailing × when provided. */
  onRemove?: () => void
  className?: string
}

function FileUploadRow({
  name,
  size,
  status = "uploading",
  progress = 0,
  queuedLabel = "Queued",
  onRemove,
  className,
}: FileUploadRowProps) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)))

  return (
    <div className={cn("bg-surface flex w-full items-center gap-[9px] px-3 py-3", className)}>
      {/* Leading icon badge */}
      <div className="bg-primary-tint grid size-8 shrink-0 place-items-center">
        <FileText className="text-primary size-5" />
      </div>

      {/* Name + upload affordance */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="type-body text-foreground truncate">{name}</span>
          {size != null && (
            <span className="text-subtle shrink-0 text-[12px] leading-none">{size}</span>
          )}
        </div>

        {status === "queued" ? (
          <Badge variant="neutral" className="self-start">
            {queuedLabel}
          </Badge>
        ) : (
          <div className="flex items-center gap-3">
            <Progress value={pct} className="bg-muted h-1.5" />
            <span className="text-subtle w-9 shrink-0 text-right text-[12px] leading-none tabular-nums">
              {pct}%
            </span>
          </div>
        )}
      </div>

      {/* Trailing cancel — bare 20px icon */}
      {onRemove != null && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Cancel upload"
          className="text-foreground hover:text-destructive grid size-5 shrink-0 place-items-center transition-colors"
        >
          <X className="size-5" />
        </button>
      )}
    </div>
  )
}

export { FileUploadRow }
export type { FileUploadRowProps, FileUploadRowStatus }
