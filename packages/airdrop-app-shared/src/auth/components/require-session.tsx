import type { ReactNode } from "react"
import { useApiKey } from "@repo/auth"

export interface RequireSessionProps {
  children: ReactNode
}

/**
 * Render-time auth gate for the authenticated route subtree.
 *
 * `_app`'s `beforeLoad` guards auth at NAVIGATION time; `CrossTabAuthGate`
 * redirects at EFFECT time once `apiKey` clears mid-session. Neither stops the
 * authed subtree from RENDERING in the commit where `apiKey` goes null — and in
 * that same commit `AcsProvider` recomputes an admin-less config, so any admin
 * hook still mounted (`useAppConf` in the sidebar, the page outlets) calls
 * `getClient('admin')`, which THROWS during render. The root error boundary
 * then flashes "No admin client configured" before the effect-time redirect
 * lands on the login route.
 *
 * This gate is the missing render-time complement: while there is no key, render
 * nothing, so no admin hook runs and nothing throws. The actual redirect stays
 * with `CrossTabAuthGate` (mounted above this boundary, so it keeps running) —
 * gating only on `!apiKey` keeps the two paired: whenever this blanks the tree,
 * that gate is already navigating away. Token expiry is intentionally NOT gated
 * here (it would blank the tree without a paired redirect); expiry stays handled
 * by `beforeLoad` on navigation and by the 401 bridge on the next request.
 */
export function RequireSession({ children }: RequireSessionProps) {
  const apiKey = useApiKey()
  if (!apiKey) return null
  return <>{children}</>
}
