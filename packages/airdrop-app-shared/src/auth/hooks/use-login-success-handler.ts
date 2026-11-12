import { useNavigate, useSearch } from "@tanstack/react-router"
import { useClearSession } from "@repo/auth"
import { clearPersistedApiKey } from "@repo/auth/storage"
import { toast } from "@repo/ui/components/sonner"
import { meetsLevel, type CapabilityLevel } from "@repo/acs-client/model"
import { useInspectLoginToken } from "./use-inspect-login-token"
import { sanitizeNext } from "../utils/sanitize-next"

export interface LoginSuccessOptions {
  /**
   * Minimum console level to admit. Admin consoles pass 'read' (admit read +
   * write members). The portal passes 'none' (recipients have no `all` scope
   * and are authorized by `read:appConf`). Below this level → forbiddenRoute.
   */
  minLevel?: CapabilityLevel
  /** Route a sub-`minLevel` user is sent to. Defaults to `/forbidden`. */
  forbiddenRoute?: string
  /** Destination when there is no (valid) `?next`. Defaults to `/`. */
  homeRoute?: string
}

/**
 * Login-success handler shared by all three apps' login pages. Validates the
 * token, clears the session on failure, gates on `minLevel`, then toasts and
 * navigates to a runtime-sanitized `?next` (or home).
 *
 * Returns the handler the page wires to the EVM / Solana / API-key buttons —
 * the UX (toast + navigate) is the caller's explicit handler, exported from the
 * hook (the preferred "export-fn" shape), not a buried effect.
 */
export function useLoginSuccessHandler({
  minLevel = "read",
  forbiddenRoute = "/forbidden",
  homeRoute = "/",
}: LoginSuccessOptions) {
  const navigate = useNavigate()
  const clearSession = useClearSession()
  const inspectLoginToken = useInspectLoginToken()
  // /login declares `next?: string` in its search schema; read non-strictly
  // because this runs from child buttons not typed against /login directly.
  const search = useSearch({ strict: false }) as { next?: string }

  return async (token: string) => {
    const outcome = await inspectLoginToken(token)
    if (!outcome.ok) {
      clearSession()
      clearPersistedApiKey()
      toast.error(outcome.message)
      return
    }
    if (!meetsLevel(outcome.level, minLevel)) {
      void navigate({ to: forbiddenRoute, replace: true })
      return
    }
    toast.success("Signed in")
    void navigate({ to: sanitizeNext(search.next) ?? homeRoute, replace: true })
  }
}
