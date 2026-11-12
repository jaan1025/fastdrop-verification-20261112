import { type MouseEvent, useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { Button } from "@repo/ui/components/button"

const COPIED_FEEDBACK_MS = 1500

export interface CopyButtonProps {
  /** The string written to the clipboard on click. */
  value: string
  /** Accessible label for the button. Defaults to "Copy". */
  copyLabel?: string
  /** Icon button size. Defaults to `icon-xs`. */
  size?: "icon-xs" | "icon-sm"
  className?: string
}

/**
 * Ghost icon copy button with ~1.5s check-mark feedback. Stops click
 * propagation so it stays inert inside a clickable row/card. Extracted from
 * `CopyableValue` so callers that own their own layout (e.g. `DetailRow`) can
 * place just the button next to a wrapping value.
 */
export function CopyButton({
  value,
  copyLabel = "Copy",
  size = "icon-xs",
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const onCopy = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    void navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={onCopy}
      aria-label={copyLabel}
      className={className}
    >
      {copied ? <CheckIcon className="text-primary" /> : <CopyIcon />}
    </Button>
  )
}
