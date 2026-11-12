import { createVersionedStorageEntry } from "../../utils/storage"
import type { FlowPersistedEntry, FlowPersistence } from "./types"

// (internal) The flow persistence adapter extracted from the legacy mega-hook
// (L2), built on the package's one storage primitive instead of hand-rolled
// localStorage I/O. Render-free, unit-testable. The legacy private
// `readEntry`/`writeEntry`/`clearEntry` are subsumed by the storage primitive;
// this file only shapes the flow envelope.

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000

export interface FlowStore<Step extends string, Resume> {
  /** Parse + validate (version/TTL); drops corrupt/expired; SSR-safe. */
  read(): FlowPersistedEntry<Step, Resume> | null
  /** Best-effort write of a v1 entry with current timestamp; swallows errors. */
  write(completedSteps: Step[], resume: Resume): void
  /** Remove the persisted entry; SSR-safe. */
  clear(): void
}

export const createFlowStore = <Step extends string, Resume>(
  persistence: FlowPersistence,
): FlowStore<Step, Resume> => {
  const entry = createVersionedStorageEntry<FlowPersistedEntry<Step, Resume>>(persistence.key, {
    version: 1,
    ttlMs: persistence.ttlMs ?? DEFAULT_TTL_MS,
  })

  return {
    read: () => entry.read(),
    write: (completedSteps, resume) => {
      entry.write({
        v: 1,
        ts: Date.now(),
        completedSteps,
        resume,
      })
    },
    clear: () => entry.clear(),
  }
}
