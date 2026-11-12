import { createContext, useContext, type ReactNode } from "react"

/** The modal's lifecycle phases. */
export type AsyncTxModalState = "confirm" | "signing" | "confirming" | "success" | "error"

/** One row of the in-flight checklist. */
export interface AsyncTxStep {
  /** Step identity (matched against `currentStepId`). */
  id: string
  /** Step display label. */
  label: ReactNode
}

/** The context value the compound root provides to its phase parts. */
export interface AsyncTxPhaseContext {
  /** Current (frozen-during-exit) lifecycle phase. */
  state: AsyncTxModalState
  /** True while signing/confirming — close is blocked. */
  locked: boolean
  /** Request the dialog be closed — wired to the root's `onOpenChange(false)`;
   *  used by the Cancel/Done/Close buttons in the phase parts so they need no
   *  prop drilling for the close action. */
  requestClose: () => void
}

const PhaseContext = createContext<AsyncTxPhaseContext | null>(null)

export const AsyncTxPhaseProvider = PhaseContext.Provider

/**
 * Reads the phase context. Throws if a part is rendered outside `<AsyncTxModal>`
 * — a fail-fast composition guard (a phase part is meaningless without the root).
 */
export function useAsyncTxPhase(): AsyncTxPhaseContext {
  const ctx = useContext(PhaseContext)
  if (ctx === null) {
    throw new Error(
      "AsyncTxModal phase parts (`.Confirm`/`.Signing`/`.Success`/`.Error`/`.Steps`) must be rendered inside <AsyncTxModal>.",
    )
  }
  return ctx
}
