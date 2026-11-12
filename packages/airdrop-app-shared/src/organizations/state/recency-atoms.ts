import { getDefaultStore } from "jotai"
import { atomWithStorage } from "jotai/utils"

export type OrganizationRecency = Record<string, number>

export const organizationRecencyAtom = atomWithStorage<OrganizationRecency>(
  "clique:organizations:recency",
  {},
  undefined,
  { getOnInit: true },
)

/**
 * Non-hook snapshot reader for use outside React (router `beforeLoad`, etc.).
 * Goes through the Jotai default store so atom semantics are preserved —
 * never bypass with raw `localStorage.getItem("clique:organizations:recency")`.
 */
export const readOrganizationRecencySnapshot = (): OrganizationRecency =>
  getDefaultStore().get(organizationRecencyAtom)
