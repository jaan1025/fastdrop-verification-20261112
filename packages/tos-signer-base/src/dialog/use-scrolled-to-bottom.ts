"use client"

// Reusable "consent-requires-full-scroll" gate: tracks whether a scroll
// container has been read to the bottom (with slack), auto-enabling when the
// content is shorter than the viewport. Extracted from the legacy `ToSDialog`
// inline logic so the gate is testable and any consent/legal surface can reuse
// it (analysis Low).
import { useCallback, useRef, useState } from "react"

/**
 * Pure: is a scroll container within `slack` px of its bottom — OR not scrollable
 * at all (content shorter than the viewport, `scrollHeight <= clientHeight`)?
 * Both cases mean "there is nothing more to read", so consent may proceed.
 */
export function isAtBottom(
  metrics: { scrollHeight: number; scrollTop: number; clientHeight: number },
  slack = 2,
): boolean {
  return metrics.scrollHeight - metrics.scrollTop - metrics.clientHeight <= slack
}

export interface ScrolledToBottomGate {
  /** Attach to the scroll container (a CALLBACK ref, not a RefObject). */
  ref: (node: HTMLElement | null) => void
  /** True once read to the bottom, or immediately for short/unscrollable content. */
  scrolledToBottom: boolean
}

/**
 * Gate for "consent requires reading to the bottom". Returns a **callback ref** +
 * the boolean.
 *
 * Why a callback ref (not a `RefObject` + `useEffect`): the consent dialog is
 * persistently mounted with its `open` flag toggling, and Radix mounts the dialog
 * content on its OWN schedule (portal + presence) — so an effect keyed on the ref
 * object runs once at mount, finds the scroll node absent, and never re-measures
 * when the dialog later opens, leaving Accept stuck disabled. A callback ref fires
 * exactly when React attaches/detaches the node, whatever the timing: on attach we
 * re-arm the gate and measure (rAF for post-layout `scrollHeight`, a `scroll`
 * listener, and a `ResizeObserver` for content/size changes); on detach we clean up.
 */
export const useScrolledToBottom = (options?: { slack?: number }): ScrolledToBottomGate => {
  const slack = options?.slack ?? 2
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  const ref = useCallback(
    (node: HTMLElement | null) => {
      // Detach from any previous node (dialog closed / remounted).
      cleanupRef.current?.()
      cleanupRef.current = null
      if (!node) return

      // Re-arm the gate for this fresh mount (a reused dialog must re-gate).
      setScrolledToBottom(false)

      const check = () => {
        if (isAtBottom(node, slack)) setScrolledToBottom(true)
      }
      // The node just attached; scrollHeight may not be laid out yet — measure
      // after the next frame, and again on scroll + on any size/content change.
      const raf = requestAnimationFrame(check)
      node.addEventListener("scroll", check)
      const observer =
        typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => check()) : null
      observer?.observe(node)

      cleanupRef.current = () => {
        cancelAnimationFrame(raf)
        node.removeEventListener("scroll", check)
        observer?.disconnect()
      }
    },
    [slack],
  )

  return { ref, scrolledToBottom }
}
