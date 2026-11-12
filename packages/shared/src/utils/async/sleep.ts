export interface SleepOptions {
  signal?: AbortSignal
}

/**
 * Pauses execution for the specified duration.
 * @param ms - Time to sleep in milliseconds
 * @param options - Optional configuration
 */
export const sleep = (ms: number, options?: SleepOptions): Promise<void> => {
  const { signal } = options || {}

  if (signal?.aborted) {
    return Promise.reject(new Error("aborted"))
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      resolve()
    }, ms)

    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeoutId)
        reject(new Error("aborted"))
      },
      { once: true },
    )
  })
}
