import type { FlowState } from "./types"

// (internal) The pure step state-machine core extracted from the legacy mega-hook
// (L2) — transitions + reentrancy guard, render-free and unit-testable without
// React. No storage, no React.

type FlowAction<Step extends string> =
  | { kind: "advance"; step: Step }
  | { kind: "complete"; step: Step }
  | { kind: "fail"; step: Step; message: string }
  | { kind: "reset" }

export const initialFlowState = <Step extends string>(): FlowState<Step> => ({
  currentStep: null,
  completedSteps: [],
  error: null,
})

/** Pure reducer applying one action to state; the single home for transition
 *  logic (tested directly). */
export const flowReducer = <Step extends string>(
  state: FlowState<Step>,
  action: FlowAction<Step>,
): FlowState<Step> => {
  switch (action.kind) {
    case "advance":
      return { ...state, currentStep: action.step, error: null }
    case "complete":
      return state.completedSteps.includes(action.step)
        ? state
        : { ...state, completedSteps: [...state.completedSteps, action.step] }
    case "fail":
      return {
        ...state,
        error: { step: action.step, message: action.message },
      }
    case "reset":
      return initialFlowState<Step>()
  }
}

export const isRunning = <Step extends string>(state: FlowState<Step>): boolean =>
  state.currentStep !== null && state.error === null

export const isComplete = <Step extends string>(
  state: FlowState<Step>,
  totalSteps: number,
): boolean => state.completedSteps.length === totalSteps && state.error === null

/** Pure (closure-over-ref) reentrancy guard; returns `undefined` when a call is
 *  already in flight. Shared concept with `useAsyncPersistFn`'s pending flag. */
export const createReentrancyGuard = () => {
  let inFlight = false
  return {
    run: async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
      if (inFlight) return undefined
      inFlight = true
      try {
        return await fn()
      } finally {
        inFlight = false
      }
    },
  }
}
