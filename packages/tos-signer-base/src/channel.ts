"use client"

// (internal) The matched-pair link: mints a private channel token once and
// exposes typed emit/subscribe over `@repo/shared`'s async event bus, so
// emitter ↔ host are coupled by construction rather than by a hand-matched
// `eventName` string. Replaces the legacy stringly-typed `eventName` convention
// (analysis High #2).
//
// Deviation from the blueprint's literal "private Symbol token": the implemented
// `@repo/shared/event` bus stringifies its key (`String(event)`) and types it as
// `GlobalEventName`, so an anonymous `Symbol()` would (a) all collapse to the
// same `"Symbol()"` string (collision) and (b) not satisfy `GlobalEventName`
// once acs-client augments the registry. We therefore mint a process-unique
// PRIVATE STRING token instead. It achieves identical guarantees — it is never
// exported, never user-settable, and the emitter/host are matched at the type
// level by sharing one `ToSChannel` instance — without modifying Tier 0.
import { emitGlobalAsyncEvent, useGlobalAsyncEvent } from "@repo/shared/event"

import type { SigningOptions } from "./types"

/** A typed, private signing channel returned by `createToSChannel`. */
export interface ToSChannel<Signature extends string = string, Payload = void> {
  /** Publish a sign request on the private token; resolves with the signature (Accept) or rejects (Cancel/failure). */
  emit: (options: SigningOptions<Payload>) => Promise<Signature>
  /** React adapter binding the host's handler to the private token. */
  useSubscribe: (handler: (options: SigningOptions<Payload>) => Promise<Signature>) => void
  /** The private channel token (module-private; never exported from the package). */
  token: string
}

// The shared bus types its key as `GlobalEventName` and its args via
// `GlobalEventArgs`; once acs-client augments the registry, that narrows away
// our ad-hoc `[SigningOptions]` payload. We retype the two bus entry points at
// this single internal boundary so the private channel can carry its own typed
// payload tuple — the only place a cast is needed.
const emitOnBus = emitGlobalAsyncEvent as unknown as <Signature, Payload>(
  event: string,
  options: SigningOptions<Payload>,
) => Promise<Signature>

const useBusSubscription = useGlobalAsyncEvent as unknown as <Signature, Payload>(
  event: string,
  handler: (options: SigningOptions<Payload>) => void,
) => {
  resolve: (value: Signature) => void
  reject: (reason?: unknown) => void
}

let channelCounter = 0

/**
 * Mints a fresh, process-unique private token and returns matched
 * `emit`/`useSubscribe` bound to it over the shared async bus. Called once per
 * `createToSSigner`; the token never surfaces publicly, so there is no string to
 * mistype and no cross-package convention to keep in sync. Because the same
 * `ToSChannel` instance is shared by the emitter hook, the host hook, and the
 * ensure hook within one `createToSSigner`, "mount exactly one host" becomes a
 * per-instance contract, not a global stringly-typed one.
 */
export const createToSChannel = <Signature extends string = string, Payload = void>(): ToSChannel<
  Signature,
  Payload
> => {
  const token = `@repo/tos-signer-base:channel:${++channelCounter}:${Math.random()
    .toString(36)
    .slice(2)}`

  const emit = (options: SigningOptions<Payload>): Promise<Signature> =>
    emitOnBus<Signature, Payload>(token, options)

  const useSubscribe = (
    handler: (options: SigningOptions<Payload>) => Promise<Signature>,
  ): void => {
    const { resolve, reject } = useBusSubscription<Signature, Payload>(token, (options) => {
      handler(options).then(resolve, reject)
    })
  }

  return { emit, useSubscribe, token }
}
