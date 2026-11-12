import { useEffect, useRef } from "react"
import { toast } from "@repo/ui/components/sonner"

export interface OneShotToastProps {
  /** Fire when this first becomes true. Fires at most once per mount. */
  when: boolean
  message: string
  /** Optional second line under the message. */
  description?: string
  /** Optional action button. */
  action?: { label: string; onClick: () => void }
  /** Sonner channel. Default "info". */
  variant?: "info" | "success" | "warning" | "error"
}

// Declarative one-shot toast: fires once when `when` first turns true, then
// never again for the lifetime of the mount. Renders nothing — it gives
// mount-time notices a component-owned home instead of every page
// hand-rolling the same ref + effect (UX side effects belong in components,
// not hooks).
export function OneShotToast({
  when,
  message,
  description,
  action,
  variant = "info",
}: OneShotToastProps) {
  const shown = useRef(false)
  useEffect(() => {
    if (!when || shown.current) return
    shown.current = true
    const fire = {
      info: toast.info,
      success: toast.success,
      warning: toast.warning,
      error: toast.error,
    }[variant]
    fire(message, {
      ...(description ? { description } : {}),
      ...(action ? { action: { label: action.label, onClick: action.onClick } } : {}),
    })
  }, [when, message, description, action, variant])
  return null
}
