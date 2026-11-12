import { useSetSessionExpired } from "@repo/auth"
import { EVENTS } from "@repo/shared/constants"
import { useGlobalEvent } from "@repo/shared/event"

// Listens to the global auth-error event emitted by HTTP layers (ACS transport
// 401 handler, TanStack Query onError) and flips the session-expired atom.
// Idempotent — repeat emits while the atom is already true are no-ops.
export function useServerAuthErrorBridge() {
  const setExpired = useSetSessionExpired()
  useGlobalEvent(EVENTS.Unauthorized, () => setExpired(true))
}
