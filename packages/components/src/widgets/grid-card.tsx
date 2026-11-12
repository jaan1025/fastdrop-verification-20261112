import * as React from "react"
import { MoreHorizontal, Folder, FileText } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { Button } from "@repo/ui/components/button"

/**
 * GridCard — file/folder tile 202×174px.
 * Selected: bg #f5f9ff + border #4c97ff.
 * Default: bg white + border rgba(0,0,0,0.15).
 * 3-dot menu trigger top-right (20×20).
 * Icon 48×48 centred (near-black outline per Figma); label (Funnel Sans 14px) bottom-centred.
 */
type GridCardProps = {
  name: string
  kind: "file" | "folder"
  selected?: boolean
  onMenuClick?: (e: React.MouseEvent) => void
  onClick?: () => void
}

function GridCard({ name, kind, selected = false, onMenuClick, onClick }: GridCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-visible:ring-ring relative flex h-[174px] w-[202px] shrink-0 flex-col items-center justify-center overflow-clip border transition-colors focus-visible:ring-2 focus-visible:outline-none",
        selected
          ? "border-[#4c97ff] bg-[#f5f9ff]"
          : "border-[rgba(0,0,0,0.15)] bg-white hover:bg-[#f9f9f9]",
      )}
    >
      {/* 3-dot trigger — absolute top-right */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="hover:text-foreground absolute top-[8px] right-[8px] size-5 rounded-none text-[rgba(0,0,0,0.5)]"
        onClick={(e) => {
          e.stopPropagation()
          onMenuClick?.(e)
        }}
        aria-label="More options"
      >
        <MoreHorizontal className="size-5" />
      </Button>

      {/* Icon 48×48 centred — near-black outline per Figma (1F1F1F, no fill) */}
      <div className="flex size-12 items-center justify-center">
        {kind === "folder" ? (
          <Folder className="size-12 fill-none stroke-[rgba(0,0,0,0.85)]" strokeWidth={1.5} />
        ) : (
          <FileText className="size-12 fill-none stroke-[rgba(0,0,0,0.85)]" strokeWidth={1.5} />
        )}
      </div>

      {/* Label — Funnel Sans 14px (CANON; Figma default tile uses Funnel Sans), bottom-centred */}
      <span className="absolute right-0 bottom-[24px] left-0 truncate px-3 text-center font-sans text-[14px] leading-normal text-black">
        {name}
      </span>
    </button>
  )
}

export { GridCard }
export type { GridCardProps }
