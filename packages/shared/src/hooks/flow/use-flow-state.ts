import { useMemo, useRef, useState } from "react"

import {
  createReentrancyGuard,
  flowReducer,
  initialFlowState,
  isComplete as machineIsComplete,
  isRunning as machineIsRunning,
} from "./machine"
import { createFlowStore, type FlowStore } from "./persistence"
import type { FlowController, FlowPersistedEntry, FlowPersistence, FlowState } from "./types"

// The thin React hook wiring the pure machine + (optional) persistence adapter
// into a `FlowController` — the reusable async-pipeline state machine for
// multi-step create/resume flows. `state` lives in `useState`; parallel refs
// (`completedRef`/`resumeRef`) survive await boundaries; storage is mirrored when
// persistence is configured.
export function useFlowState<Step extends string, Resume extends Record<string, unknown>>(
  initialResume: () => Resume,
  persistence?: FlowPersistence,
): FlowController<Step, Resume> {
  const [state, setState] = useState<FlowState<Step>>(() => initialFlowState<Step>())

  const completedRef = useRef<Set<Step>>(new Set())
  const resumeRef = useRef<Resume>(initialResume())
  const guardRef = useRef(createReentrancyGuard())

  const store = useMemo<FlowStore<Step, Resume> | null>(
    () => (persistence ? createFlowStore<Step, Resume>(persistence) : null),
    // persistence is treated as a stable config; key/ttl are not expected to
    // change across the flow's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persistence?.key, persistence?.ttlMs],
  )

  const persist = () => {
    store?.write([...completedRef.current], resumeRef.current)
  }

  const advance = (step: Step) => {
    setState((s) => flowReducer(s, { kind: "advance", step }))
    persist()
  }

  const completeStep = (step: Step) => {
    completedRef.current.add(step)
    setState((s) => flowReducer(s, { kind: "complete", step }))
    persist()
  }

  const fail = (step: Step, message: string) => {
    setState((s) => flowReducer(s, { kind: "fail", step, message }))
    persist()
  }

  const reset = () => {
    completedRef.current = new Set()
    resumeRef.current = initialResume()
    setState(initialFlowState<Step>())
    store?.clear()
  }

  const isDone = (step: Step) => completedRef.current.has(step)

  const hydrate = (accept?: (entry: FlowPersistedEntry<Step, Resume>) => boolean): boolean => {
    const entry = store?.read()
    if (!entry) return false
    if (accept && !accept(entry)) return false
    completedRef.current = new Set(entry.completedSteps)
    resumeRef.current = entry.resume
    setState({
      currentStep: null,
      completedSteps: entry.completedSteps,
      error: null,
    })
    return true
  }

  const peek = (): FlowPersistedEntry<Step, Resume> | null => store?.read() ?? null

  const clearPersisted = () => {
    store?.clear()
  }

  return {
    state,
    get resume() {
      return resumeRef.current
    },
    advance,
    completeStep,
    fail,
    reset,
    isDone,
    isRunning: machineIsRunning(state),
    isComplete: (totalSteps: number) => machineIsComplete(state, totalSteps),
    runGuarded: (fn) => guardRef.current.run(fn),
    hydrate,
    peek,
    clearPersisted,
  }
}
