import { getDocument, isDocumentVisible } from "../env"

export interface ClientRetryOptions {
  /** Polling interval when the page is visible (default: 5000ms) */
  activeInterval?: number
  /** Polling interval when the page is in the background (default: 30000ms) */
  backgroundInterval?: number
  /** Maximum total duration before giving up (default: 5 hours) */
  maxDuration?: number
  signal?: AbortSignal
  onError?: (error: unknown) => void
}

/**
 * Visibility-aware retry for browser environments.
 * Polls faster when the user is on the page, slower in the background.
 * When the user returns to the page, polls immediately.
 *
 * `fn` should throw to signal "not ready, keep polling" and return a value on success.
 * Same semantics as `retry`, but with adaptive intervals instead of fixed ones.
 */
export const clientRetry = <T>(fn: () => Promise<T>, options?: ClientRetryOptions): Promise<T> => {
  const {
    activeInterval = 5_000,
    backgroundInterval = 30_000,
    maxDuration = 5 * 60 * 60 * 1_000,
    signal,
    onError,
  } = options ?? {}

  const startTime = Date.now()

  return new Promise<T>((resolve, reject) => {
    let stopped = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const cleanup = () => {
      stopped = true
      if (timeoutId) clearTimeout(timeoutId)
      const doc = getDocument()
      if (doc) {
        doc.removeEventListener("visibilitychange", onVisibilityChange)
      }
      signal?.removeEventListener("abort", onAbort)
    }

    const settle = (outcome: typeof resolve | typeof reject, value: T | Error) => {
      cleanup()
      outcome(value as T & Error)
    }

    const scheduleNext = () => {
      if (stopped) return
      const interval = isDocumentVisible() ? activeInterval : backgroundInterval
      timeoutId = setTimeout(poll, interval)
    }

    const poll = async () => {
      if (stopped) return

      if (Date.now() - startTime > maxDuration) {
        settle(reject, new Error("Client retry timeout exceeded"))
        return
      }

      try {
        const result = await fn()
        settle(resolve, result)
      } catch (error) {
        onError?.(error)
        scheduleNext()
      }
    }

    const onVisibilityChange = () => {
      if (isDocumentVisible() && !stopped) {
        if (timeoutId) clearTimeout(timeoutId)
        poll()
      }
    }

    const onAbort = () => {
      settle(reject, new Error("aborted"))
    }

    const doc = getDocument()
    if (doc) {
      doc.addEventListener("visibilitychange", onVisibilityChange)
    }

    if (signal?.aborted) {
      settle(reject, new Error("aborted"))
      return
    }
    signal?.addEventListener("abort", onAbort, { once: true })

    poll()
  })
}
