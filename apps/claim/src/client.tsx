// Browser entry. Sentry client init MUST be the first import so the SDK
// instruments everything downstream (no-ops without VITE_SENTRY_DSN).
import { initClientSentry } from "@repo/sentry/client"

initClientSentry()

import { StartClient } from "@tanstack/react-start/client"
import { StrictMode, startTransition } from "react"
import { hydrateRoot } from "react-dom/client"

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  )
})
