import type { ReactNode } from "react"
import { useServerAuthErrorBridge } from "../auth/hooks/use-server-auth-error-bridge"
import { ServerAuthErrorGate } from "../auth/components/server-auth-error-gate"
import { CrossTabAuthGate } from "../auth/components/cross-tab-auth-gate"

export interface AuthSideEffectsProps {
  /** Redirect target on session loss, passed to both gates (e.g. `"/login"`). */
  loginRoute: string
  /**
   * Extra app-specific auth gates (e.g. the portal's `IdentityChangeGate`);
   * rendered alongside the standard gates.
   */
  extraGates?: ReactNode
}

/**
 * Named root part: bundles the shared auth side-effect machinery.
 *   • bridge:         HTTP 401 events → sessionExpiredAtom
 *   • server gate:    sessionExpiredAtom flip → cleanup + redirect with returnTo
 *   • cross-tab gate: another tab's logout → redirect (no returnTo)
 *   • extra gates:    app-specific (e.g. portal IdentityChangeGate)
 *
 * Renders no visible UI (every gate is headless).
 */
export function AuthSideEffects({ loginRoute, extraGates }: AuthSideEffectsProps) {
  useServerAuthErrorBridge()
  return (
    <>
      <ServerAuthErrorGate loginRoute={loginRoute} />
      <CrossTabAuthGate loginRoute={loginRoute} />
      {extraGates}
    </>
  )
}
