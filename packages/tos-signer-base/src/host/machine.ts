// (internal) Pure ToS host state-machine core: the render-free, I/O-free
// transition logic for one consent-and-sign cycle
// (idle → prompting → signing → done/cancelled). Extracted from the legacy
// imperative `BaseToSSigner` component so the consent decision is unit-testable
// without rendering a dialog (L2). Zero React, zero I/O.
import { matchUnion } from "@repo/shared/utils"

import type { SigningOptions } from "../types"

/**
 * The current cycle phase. Drives `open` (= `phase !== 'idle'`) and `pending`
 * (= `phase === 'signing'`).
 */
export type ToSHostPhase = "idle" | "prompting" | "signing"

/** The reducer state. */
export interface ToSHostMachineState<Payload = void> {
  phase: ToSHostPhase
  /** The in-flight sign request; null when idle. */
  request: SigningOptions<Payload> | null
}

/** Discriminated transition union. */
export type ToSHostEvent<Payload = void> =
  /** A sign request arrived; if `request.skipDialog`, fast-paths to signing. */
  | { kind: "prompt"; request: SigningOptions<Payload> }
  /** Accept. */
  | { kind: "confirm" }
  /** Cancel / dismiss. */
  | { kind: "cancel" }
  /** Sign succeeded or failed — return to idle. */
  | { kind: "settled" }

/** The `{ phase: 'idle', request: null }` starting state. */
export const initialToSHostState = <Payload = void>(): ToSHostMachineState<Payload> => ({
  phase: "idle",
  request: null,
})

/**
 * Pure transition fn dispatched via exhaustive `matchUnion` on `event.kind`.
 * Invalid transitions (e.g. `confirm` while idle) are no-ops returning the same
 * state reference. No side effects — the hook performs the actual
 * signing/caching/resolve.
 */
export const tosHostReducer = <Payload = void>(
  state: ToSHostMachineState<Payload>,
  event: ToSHostEvent<Payload>,
): ToSHostMachineState<Payload> =>
  matchUnion(event, "kind", {
    prompt: (e): ToSHostMachineState<Payload> => ({
      phase: e.request.skipDialog ? "signing" : "prompting",
      request: e.request,
    }),
    confirm: (): ToSHostMachineState<Payload> =>
      state.phase === "prompting" ? { phase: "signing", request: state.request } : state,
    cancel: (): ToSHostMachineState<Payload> =>
      state.phase === "idle" ? state : initialToSHostState<Payload>(),
    settled: (): ToSHostMachineState<Payload> =>
      state.phase === "signing" ? initialToSHostState<Payload>() : state,
  })
