// The flow type surface (shared by machine, persistence, and the hook). One home
// for the flow vocabulary so machine/persistence/hook never restate it (L3).

export type FlowError<Step extends string> = {
  step: Step
  message: string
}

export type FlowState<Step extends string> = {
  currentStep: Step | null
  completedSteps: Step[]
  error: FlowError<Step> | null
}

export type FlowPersistedEntry<Step extends string, Resume> = {
  v: 1
  ts: number
  completedSteps: Step[]
  resume: Resume
}

export type FlowPersistence = {
  /** localStorage key. Include the scoping id (projectId / org) in the key. */
  key: string
  /** Max age before a persisted entry is ignored. Default 24h. */
  ttlMs?: number
}

export type FlowController<Step extends string, Resume> = {
  state: FlowState<Step>
  /** Getter returning the live resume payload (from ref). */
  resume: Resume
  /** Set the current step and clear error. */
  advance: (step: Step) => void
  /** Mark a step done. */
  completeStep: (step: Step) => void
  /** Record an error against a step. */
  fail: (step: Step, message: string) => void
  /** Clear all state, reset resume, drop persisted entry. */
  reset: () => void
  /** Whether a step has completed. */
  isDone: (step: Step) => boolean
  /** A step is active with no error. */
  isRunning: boolean
  /** All steps completed and no error. */
  isComplete: (totalSteps: number) => boolean
  /** Reentrancy guard; returns `undefined` if already in flight. */
  runGuarded: <T>(fn: () => Promise<T>) => Promise<T | undefined>
  /** Rehydrate completed steps + resume payload from storage. Returns true when
   *  an un-expired entry was found AND `accept` (if given) returned true. No-op
   *  when persistence is disabled. */
  hydrate: (accept?: (entry: FlowPersistedEntry<Step, Resume>) => boolean) => boolean
  /** Read the persisted entry without applying it. Null when absent /
   *  expired / disabled. */
  peek: () => FlowPersistedEntry<Step, Resume> | null
  /** Drop the persisted entry ONLY — in-memory state stays. */
  clearPersisted: () => void
}
