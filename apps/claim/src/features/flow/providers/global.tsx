import type { ReactNode } from "react"
import { EVENTS } from "@repo/shared/constants"
import { useGlobalEvent } from "@repo/shared/event"
import { usePersistFn } from "@repo/shared/hooks"

// The always-on 401 guard. Port of mono `components/global.tsx`: on a global
// 'unauthorized' event (emitted by the ACS transport on any 401), clear the JWT
// vault and reload the page after 2s.
//
// mono cleared the JWT via @airdrop/clique-account's `useJWT().clearJWT()`. This
// app does not depend on clique-account (no account sign-in in the claim flow —
// the ToS signature is cached separately and ACS reads carry the vault JWT), so
// the handler clears the `map-jwt` vault directly. Same observable behaviour.
//
// The ToS dialog host is NOT mounted here — it is injected into the mounted arm's
// chain provider wallet tree as a slot (see arms/flow-evm.tsx / flow-solana.tsx),
// so the host's `useSignMessage` / `useSolana` hooks resolve inside the right
// wallet context. `Global` itself is chain-free.
const clearJwtVault = (): void => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem("map-jwt")
  } catch {
    // ignore storage errors (private mode / disabled storage)
  }
}

export const Global = ({ children }: { children: ReactNode }) => {
  const handleUnauthorized = usePersistFn(() => {
    clearJwtVault()
    setTimeout(() => window.location.reload(), 2000)
  })

  useGlobalEvent(EVENTS.Unauthorized, handleUnauthorized)

  return <>{children}</>
}
