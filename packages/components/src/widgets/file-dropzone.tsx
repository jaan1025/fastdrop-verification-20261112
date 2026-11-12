import * as React from "react"
import { UploadCloud } from "lucide-react"

import { cn } from "@repo/ui/lib/utils"

/**
 * File Drop-zone — a dashed upload area (DESIGN-SYSTEM.md §10, new). A
 * centered column: upload icon, a "Drop files here or browse" prompt (with
 * "browse" as a primary underlined affordance backed by a hidden file input), and
 * an optional caption hint for accepted formats. Two authored states (§9): idle,
 * and a dragging state (primary border + primary-tint fill) reflected via the
 * `data-dragging` attribute so it can be styled/tested without hover.
 */
function FileDropzone({
  onFiles,
  accept,
  hint,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "onDrop"> & {
  onFiles?: (files: FileList) => void
  accept?: string
  hint?: React.ReactNode
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)

  function emit(files: FileList | null) {
    if (files && files.length > 0) onFiles?.(files)
  }

  return (
    <div
      data-slot="file-dropzone"
      data-dragging={dragging || undefined}
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        emit(event.dataTransfer.files)
      }}
      className={cn(
        "border-border bg-background flex cursor-pointer flex-col items-center gap-1 rounded-none border border-dashed px-4 py-9 text-center transition-colors",
        "data-[dragging]:border-primary data-[dragging]:bg-primary-tint",
        className,
      )}
      {...props}
    >
      <UploadCloud className="text-foreground size-8" />
      <p className="type-body-lg text-foreground">
        Drop files here or <span className="text-primary underline">browse</span>
      </p>
      {hint != null && <p className="type-body text-muted-foreground">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => emit(event.target.files)}
      />
    </div>
  )
}

export { FileDropzone }
