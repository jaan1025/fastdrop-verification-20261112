import { useEffect, useRef } from "react"

import { usePersistFn } from "../hooks"
import { addGlobalAsyncEventListener, removeGlobalAsyncEventListener } from "./bus"
import type { GlobalEventArgs, GlobalEventName } from "./map"

// React adapter for the typed async channel: subscribes to a named global async
// event and exposes `resolve`/`reject` handles the consumer calls to settle the
// awaiting promise.
export const useGlobalAsyncEvent = <E extends GlobalEventName, R = unknown>(
  eventName: E,
  handler: (...args: GlobalEventArgs<E>) => void,
) => {
  const resolveFnRef = useRef<((value: R) => void) | null>(null)
  const rejectFnRef = useRef<((reason?: unknown) => void) | null>(null)

  const handlerFn = usePersistFn(
    (
      resolve: (value: R) => void,
      reject: (reason?: unknown) => void,
      ...args: GlobalEventArgs<E>
    ) => {
      resolveFnRef.current = resolve
      rejectFnRef.current = reject
      handler(...args)
    },
  )

  useEffect(() => {
    addGlobalAsyncEventListener(eventName, handlerFn)
    return () => {
      removeGlobalAsyncEventListener(eventName, handlerFn)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resolve = usePersistFn((value: R) => {
    if (resolveFnRef.current) {
      resolveFnRef.current(value)
    }
  })

  const reject = usePersistFn((reason?: unknown) => {
    if (rejectFnRef.current) {
      rejectFnRef.current(reason)
    }
  })

  return { resolve, reject }
}
