import { useEffect, useRef } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useApiKey } from "@repo/auth"

export interface CrossTabAuthGateProps {
  loginRoute: string
}

// Watches `apiKey` for null transitions (e.g. another tab logged out via
// localStorage). Route-guard `beforeLoad` only runs on navigation, so without
// this gate the user would keep seeing dashboard chrome with no token.
export function CrossTabAuthGate({ loginRoute }: CrossTabAuthGateProps) {
  const apiKey = useApiKey()
  const navigate = useNavigate()
  const previouslyAuthed = useRef(apiKey != null)

  useEffect(() => {
    const isAuthed = apiKey != null
    if (previouslyAuthed.current && !isAuthed) {
      void navigate({ to: loginRoute, replace: true })
    }
    previouslyAuthed.current = isAuthed
  }, [apiKey, navigate, loginRoute])

  return null
}
