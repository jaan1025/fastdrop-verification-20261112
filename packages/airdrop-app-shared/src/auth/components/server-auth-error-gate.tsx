import { useEffect } from "react"
import { useNavigate, useRouter } from "@tanstack/react-router"
import { useSessionExpiredWatch, useSetSessionExpired } from "@repo/auth"
import { useLogout } from "../hooks/use-logout"

export interface ServerAuthErrorGateProps {
  /** Redirect target on session expiry (e.g. `"/login"`). */
  loginRoute: string
}

/**
 * Reacts to server-detected auth invalidation: when 401 fires, the bridge flips
 * `sessionExpiredAtom`, this gate clears local state and redirects to
 * `loginRoute` while preserving the current path as `?next=…` so the user lands
 * back where they were after re-authenticating.
 *
 * Safe to call wagmi hooks directly — the entire authed tree is gated on
 * `WagmiProvider` being mounted (see `EvmProvider`).
 */
export function ServerAuthErrorGate({ loginRoute }: ServerAuthErrorGateProps) {
  const expired = useSessionExpiredWatch()
  const setExpired = useSetSessionExpired()
  const navigate = useNavigate()
  const router = useRouter()
  const logout = useLogout()

  useEffect(() => {
    if (!expired) return

    const path = router.state.location.pathname
    const search = path && path !== loginRoute && path !== "/" ? { next: path } : undefined

    setExpired(false)
    void logout()

    void navigate({
      to: loginRoute,
      search,
      replace: true,
    })
  }, [expired, setExpired, logout, navigate, router, loginRoute])

  return null
}
