import { useCallback } from "react"
import { aggregateCapability, maxAllMutability, type CapabilityLevel } from "@repo/acs-client/model"
import { inspectToken } from "@repo/acs-client/actions"
import { usePublicClient as useAcsPublicClient } from "@repo/acs-client/react"
import { parseJwtPayload } from "@repo/auth/jwt"
import { extractErrorMessage } from "@repo/shared/errors"

export type LoginTokenResult = { ok: true; level: CapabilityLevel } | { ok: false; message: string }

/**
 * Validates a freshly issued JWT against ACS and resolves to the caller's
 * effective console level (none/read/write) = best org grant ∩ token claim.
 * No UX — the caller decides what to toast and where to route.
 */
export function useInspectLoginToken() {
  const acsPublicClient = useAcsPublicClient()
  return useCallback(
    async (token: string): Promise<LoginTokenResult> => {
      const payload = parseJwtPayload(token)
      const iss = payload?.iss
      if (typeof iss !== "string" || !iss) {
        return { ok: false, message: "Invalid token: missing iss claim" }
      }
      const tokenPermissions =
        Array.isArray(payload?.permissions) && payload.permissions.length > 0
          ? payload.permissions
          : ["all"]
      try {
        const result = await inspectToken(acsPublicClient, { handler: iss })
        let level = aggregateCapability(result, tokenPermissions)
        // Super-admin (app_id="all" row) whose apps aren't provisioned yet:
        // fall back to the token's own all-level so they can still enter.
        if (level === "none" && result.admin) {
          level = maxAllMutability(tokenPermissions)
        }
        return { ok: true, level }
      } catch (err) {
        const message = extractErrorMessage(err, "Token validation failed")
        return { ok: false, message: `Sign in failed: ${message}` }
      }
    },
    [acsPublicClient],
  )
}
