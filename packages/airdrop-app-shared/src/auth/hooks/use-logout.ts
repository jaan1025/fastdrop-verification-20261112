import { useClearSession } from "@repo/auth"
import { clearPersistedApiKey } from "@repo/auth/storage"
import { useDisconnect as useEvmDisconnect } from "wagmi"
import { useDisconnect as useSolanaDisconnect, useSolana } from "@repo/chain-solana-kit/react"
import { useClearOrganizationRecency } from "../../organizations/state/use-organization-recency"

// Sign-out operation: disconnect both ecosystems, clear the JWT + org recency.
// Wallet disconnect failures are swallowed — token clearing must always run.
// Post-logout navigation is the CALLER's responsibility — page navigation is
// UX and lives in the component handler (see features/README.md), not here.
//
// Sanctioned both-chain composition-root seam (it is the dual-chain case by
// definition): sign-out MUST tear down BOTH ecosystems' wallet connections, so
// this hook legitimately names wagmi AND chain-solana-kit inline — mirroring
// `use-dual-wallet-state.ts`. This is intentional composition-root wiring, NOT
// drift; covered by a rule-1 entry in scripts/chain-boundary-exceptions.json.
export function useLogout() {
  const clearSession = useClearSession()
  const clearOrganizationRecency = useClearOrganizationRecency()
  const { disconnectAsync: disconnectEvm } = useEvmDisconnect()
  const { selectedWallet: solanaWallet } = useSolana()
  const [, disconnectSolana] = useSolanaDisconnect(solanaWallet)

  return async () => {
    try {
      await disconnectEvm()
    } catch {
      // ignore — already disconnected or wagmi not in tree
    }
    try {
      await disconnectSolana()
    } catch {
      // ignore
    }
    clearSession()
    clearPersistedApiKey()
    clearOrganizationRecency()
  }
}
