import * as React from "react"
import { Camera } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"

/**
 * AvatarUpload — 64×64 circular upload zone.
 * Empty state: camera icon 20px at rgba(0,0,0,.4) on rgba(217,217,217,.30) bg.
 * Filled state: preview image + bg-black/30 overlay + 16px white camera.
 * Optional label below with 8px gap at 14px; required shows a #dd3535 asterisk.
 * Figma: 693:1303 / 693:1304 / 693:1308
 */
function AvatarUpload({
  previewSrc,
  onChange,
  label,
  required,
  className,
}: {
  previewSrc?: string
  onChange: (file: File) => void
  label?: string
  required?: boolean
  className?: string
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [localPreview, setLocalPreview] = React.useState<string | null>(null)

  const preview = localPreview ?? previewSrc ?? null
  const filled = preview !== null

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setLocalPreview(url)
    onChange(file)
  }

  // Clean up object URLs on unmount or when local preview changes
  React.useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="focus-visible:ring-primary relative size-16 rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label={label ? `Upload ${label}` : "Upload avatar"}
      >
        {/* Clipped inner circle (Figma 693:1303 empty / 693:1343 filled) */}
        <span className="absolute inset-0 overflow-hidden rounded-full">
          {filled ? (
            <>
              <img src={preview} alt="Avatar preview" className="size-16 object-cover" />
              {/* Filled: a bottom 64×24 band + 16px camera (NOT a full overlay) */}
              <span className="absolute inset-x-0 bottom-0 flex h-6 items-center justify-center bg-black/30">
                <Camera size={16} color="white" aria-hidden />
              </span>
            </>
          ) : (
            <span
              className="flex size-16 items-center justify-center"
              style={{ background: "rgba(217,217,217,.30)" }}
            >
              {/* Empty: 26×26 camera (Figma photo_camera 26×26) */}
              <Camera size={26} style={{ color: "rgba(0,0,0,.4)" }} aria-hidden />
            </span>
          )}
        </span>
      </button>

      {label ? (
        <span className="font-sans text-[14px] leading-[14px]" style={{ color: "rgba(0,0,0,.6)" }}>
          {label}
          {required ? (
            <span className="text-destructive ml-0.5" aria-hidden>
              *
            </span>
          ) : null}
        </span>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={handleChange}
      />
    </div>
  )
}

export { AvatarUpload }
