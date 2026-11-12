import { createContext, useContext, type ReactNode } from "react"
import type { OrganizationSummary } from "./types"

// The org LIST source differs per app — consoles fetch an admin "all"-scope
// list, the portal a "read:appConf"-scope list — so the source stays app-side
// and is fed into this provider. Package hooks read the ambient list rather
// than threading it through ~20 (mostly no-arg) call sites.
type OrgListValue = { organizations: OrganizationSummary[]; isLoading: boolean }

const OrgListContext = createContext<OrgListValue | null>(null)

export function OrgListProvider({
  organizations,
  isLoading,
  children,
}: OrgListValue & { children: ReactNode }) {
  return (
    <OrgListContext.Provider value={{ organizations, isLoading }}>
      {children}
    </OrgListContext.Provider>
  )
}

export function useOrgList(): OrgListValue {
  const v = useContext(OrgListContext)
  if (!v) throw new Error("useOrgList must be used within OrgListProvider")
  return v
}
