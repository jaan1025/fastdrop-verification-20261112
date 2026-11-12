import { useEffect } from "react"

import { usePersistFn } from "../hooks"
import { addGlobalEventListener, removeGlobalEventListener, type GlobalEventListener } from "./bus"
import type { GlobalEventName } from "./map"

// React adapter for the typed sync channel: subscribes a (persisted) handler to
// a named global event for the component lifetime, tears it down on unmount.
export const useGlobalEvent = <E extends GlobalEventName>(
  eventName: E,
  handler: GlobalEventListener<E>,
): void => {
  const handlerFn = usePersistFn(handler)
  useEffect(() => {
    addGlobalEventListener(eventName, handlerFn)
    return () => {
      removeGlobalEventListener(eventName, handlerFn)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
