import { useState } from "react"
import { usePersistFn } from "./use-persist-fn"

export const useAsyncPersistFn = <T extends (...args: unknown[]) => unknown>(fn: T) => {
  const [isPending, setIsPending] = useState(false)

  const handle = usePersistFn(async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    setIsPending(true)
    try {
      // normalize both sync and async return values to a Promise
      return (await fn(...args)) as Awaited<ReturnType<T>>
    } finally {
      setIsPending(false)
    }
  })

  return [isPending, handle] as const
}
