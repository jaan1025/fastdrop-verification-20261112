import { sleep } from "./sleep"

export interface RetryOptions {
  maxAttempts?: number
  /** Base interval in milliseconds */
  interval?: number
  signal?: AbortSignal
  onError?: (error: unknown) => void
}

/**
 * Retries a function until it succeeds or max attempts are reached.
 * @param fn - Function to retry
 * @param options - Retry configuration
 */
export const retry = async <T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> => {
  const { maxAttempts = 100, interval = 2000, signal, onError } = options || {}

  let lastError

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw new Error("aborted")
    }

    try {
      return await fn()
    } catch (e) {
      lastError = e
      onError?.(e)
      await sleep(interval)
    }
  }

  throw lastError
}
