"use client"

// (internal) Emitter-hook factory: produces a `useSignToS` hook whose `signToS`
// publishes a sign request on the bound private channel and returns the promise
// the host resolves (Accept) or rejects (Cancel/failure). Replaces legacy
// `createUseSignToS(eventName: string)` — the channel is now a private token
// from `createToSChannel`, not a stringly-typed name (analysis High #2).
import { usePersistFn } from "@repo/shared/hooks"

import type { ToSChannel } from "../channel"
import type { SigningOptions } from "../types"

/**
 * Returns a `useSignToS` hook bound to the captured channel. Its `signToS`
 * (stable via `usePersistFn`) calls `channel.emit(options ?? {})` and returns
 * the resulting promise. No `eventName` parameter exists; the matched host (same
 * `createToSSigner`) is the only subscriber, so a missing/duplicate host is a
 * per-instance contract, not a global typo risk.
 */
export const createUseSignToS = <Signature extends string = string, Payload = void>(
  channel: ToSChannel<Signature, Payload>,
) => {
  const useSignToS = () => {
    const signToS = usePersistFn((options?: SigningOptions<Payload>) => channel.emit(options ?? {}))
    return { signToS }
  }

  return useSignToS
}
