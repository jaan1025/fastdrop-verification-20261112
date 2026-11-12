// The typed event registry: the canonical event-name keys + their payload
// tuples, replacing the legacy bare-`string` channel. The bus is parameterized
// by `GlobalEventMap` so a mis-spelled event name is a compile error and the
// async channel is typed, not an `async:`-string-prefix convention.
//
// This is generic infrastructure — it intentionally does NOT name the
// Clique-specific `Unauthorized` event. The consuming package (acs-client
// transport) declares it via module augmentation of `GlobalEventMap`:
//
//   declare module '@repo/shared/event' {
//     interface GlobalEventMap {
//       unauthorized: []
//     }
//   }

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GlobalEventMap {
  // Empty by default; consuming packages augment this interface.
}

// When the registry is empty (no consumer has augmented it yet), fall back to
// `string` so the bus stays callable; once augmented, names narrow to the keys.
export type GlobalEventName = keyof GlobalEventMap extends never ? string : keyof GlobalEventMap

export type GlobalEventArgs<E extends GlobalEventName> = E extends keyof GlobalEventMap
  ? GlobalEventMap[E] extends unknown[]
    ? GlobalEventMap[E]
    : unknown[]
  : unknown[]
