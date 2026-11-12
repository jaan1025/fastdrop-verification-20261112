import EventEmitter from "eventemitter3"

import type { GlobalEventArgs, GlobalEventName } from "./map"

// Module-singleton global event bus over `eventemitter3`, typed by
// `GlobalEventMap` (event name → payload tuple) with a first-class async channel
// (no `async:`-string-prefix convention). Sync helpers fire-and-forget; the
// async helper returns a promise a listener can settle.

// Sync and async channels are two distinct emitter instances (not a single
// emitter keyed by an `async:` string-prefix) so an async listener never
// collides with a sync one of the same name.
const syncBus = new EventEmitter()
const asyncBus = new EventEmitter()

export type GlobalEventListener<E extends GlobalEventName> = (...args: GlobalEventArgs<E>) => void

export type GlobalAsyncEventListener<E extends GlobalEventName, R = unknown> = (
  resolve: (value: R) => void,
  reject: (reason?: unknown) => void,
  ...args: GlobalEventArgs<E>
) => void

// --- sync channel ---

export const addGlobalEventListener = <E extends GlobalEventName>(
  event: E,
  listener: GlobalEventListener<E>,
): void => {
  syncBus.on(String(event), listener as (...args: unknown[]) => void)
}

export const addGlobalEventOnceListener = <E extends GlobalEventName>(
  event: E,
  listener: GlobalEventListener<E>,
): void => {
  syncBus.once(String(event), listener as (...args: unknown[]) => void)
}

export const removeGlobalEventListener = <E extends GlobalEventName>(
  event: E,
  listener: GlobalEventListener<E>,
): void => {
  syncBus.off(String(event), listener as (...args: unknown[]) => void)
}

export const emitGlobalEvent = <E extends GlobalEventName>(
  event: E,
  ...args: GlobalEventArgs<E>
): void => {
  syncBus.emit(String(event), ...args)
}

// --- async channel ---

export const addGlobalAsyncEventListener = <E extends GlobalEventName, R = unknown>(
  event: E,
  listener: GlobalAsyncEventListener<E, R>,
): void => {
  asyncBus.on(String(event), listener as (...args: unknown[]) => void)
}

export const addGlobalAsyncEventOnceListener = <E extends GlobalEventName, R = unknown>(
  event: E,
  listener: GlobalAsyncEventListener<E, R>,
): void => {
  asyncBus.once(String(event), listener as (...args: unknown[]) => void)
}

export const removeGlobalAsyncEventListener = <E extends GlobalEventName, R = unknown>(
  event: E,
  listener: GlobalAsyncEventListener<E, R>,
): void => {
  asyncBus.off(String(event), listener as (...args: unknown[]) => void)
}

export const emitGlobalAsyncEvent = <E extends GlobalEventName, R = unknown>(
  event: E,
  ...args: GlobalEventArgs<E>
): Promise<R> =>
  new Promise<R>((resolve, reject) => {
    asyncBus.emit(String(event), resolve, reject, ...args)
  })
