import { useEffect, useRef } from "react"

/**
 * Pure freeze step: given whether the dialog is `open`, the live `value`, and
 * the `lastOpen` value captured so far, return the value to render plus the
 * next `lastOpen` to retain. While open, the value passes through and arms the
 * snapshot; while closing, the last open value is replayed and retained. Pure —
 * the single source of the freeze decision so the hook (and its timing) stays a
 * thin shell over testable logic.
 */
export function freezeStep<T>(open: boolean, value: T, lastOpen: T): { render: T; lastOpen: T } {
  if (open) return { render: value, lastOpen: value }
  return { render: lastOpen, lastOpen }
}

/**
 * Headless render-freeze hook. While a dialog plays its exit animation (open →
 * closed), returns the LAST open value of the watched state so a terminal body
 * (success/error) never flashes back to "confirm" mid-close.
 *
 * Returns `value` while `open`; while `!open`, returns the last-seen open value
 * (until the next open re-arms it). Pure timing helper — its only side-effect is
 * a ref write in an effect.
 */
export function useFreezeOnExit<T>(open: boolean, value: T): T {
  const lastOpenValueRef = useRef<T>(value)
  // Snapshot the latest value WHILE open, in render (synchronous) so the value
  // returned on the closing render is already the last open value.
  const { render, lastOpen } = freezeStep(open, value, lastOpenValueRef.current)
  lastOpenValueRef.current = lastOpen
  // Keep the ref armed across re-renders without forcing an extra paint.
  useEffect(() => {
    if (open) lastOpenValueRef.current = value
  }, [open, value])
  return render
}
