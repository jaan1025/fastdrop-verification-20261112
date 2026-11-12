export interface TimeoutOptions {
  ms: number
  message?: string
  signal?: AbortSignal
  onTimeout?: () => void
}

/**
 * Runs a function with a timeout.
 * @param fn - Function to execute
 * @param options - Timeout configuration
 */
export const timeout = <T>(fn: () => Promise<T>, options: TimeoutOptions): Promise<T> => {
  const { ms, message = "timed out", signal, onTimeout } = options

  if (signal?.aborted) {
    return Promise.reject(new Error("aborted"))
  }

  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      onTimeout?.()
      reject(new Error(message))
    }, ms)

    const abortHandler = () => {
      clearTimeout(timeoutId)
      reject(new Error("aborted"))
    }

    signal?.addEventListener("abort", abortHandler, { once: true })

    Promise.resolve(fn())
      .then((result) => {
        clearTimeout(timeoutId)
        signal?.removeEventListener("abort", abortHandler)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        signal?.removeEventListener("abort", abortHandler)
        reject(error)
      })
  })
}
