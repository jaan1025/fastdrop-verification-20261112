import { useCallback } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import { RESET } from "jotai/utils"
import { organizationRecencyAtom, type OrganizationRecency } from "./recency-atoms"

export function useOrganizationRecency(): OrganizationRecency {
  return useAtomValue(organizationRecencyAtom)
}

export function useTouchOrganization() {
  const setRecency = useSetAtom(organizationRecencyAtom)
  return useCallback(
    (organizationId: string) => {
      setRecency((prev) => ({ ...prev, [organizationId]: Date.now() }))
    },
    [setRecency],
  )
}

// `RESET` removes the localStorage key entirely instead of writing `"{}"`.
// Matches the canonical clear in `packages/shared/src/state/persist-map.ts`.
export function useClearOrganizationRecency() {
  const set = useSetAtom(organizationRecencyAtom)
  return useCallback(() => set(RESET), [set])
}
