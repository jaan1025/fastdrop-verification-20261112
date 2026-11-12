import { useEffect, useState } from "react"
import { FilledCheckIcon, FilledWarnIcon } from "@repo/icons"

// OAuth popup return page body. Port of mono
// `(light)/oauth/[platform]/callback.tsx`. Opened as a popup window by a social
// provider; on success shows a 5s countdown then `window.close()`; on error shows
// a failure message. (COOP same-origin-allow-popups in src/start.ts keeps the
// opener handle alive so window.close works.)
//
// PRESENT-BUT-UNWIRED (mono parity): no step in the claim flow initiates OAuth —
// the page exists as scaffolding a delivery can wire.

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Access Denied",
}

export interface OAuthCallbackProps {
  platform: string
  error?: string
}

export const OAuthCallback = ({ platform, error }: OAuthCallbackProps) => {
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (error) return
    if (countdown <= 0) {
      window.close()
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, error])

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <FilledWarnIcon className="text-destructive size-10" />
        <p className="text-lg font-semibold">Authentication Failed</p>
        <p className="text-muted-foreground text-sm">
          {ERROR_MESSAGES[error] ?? "Authentication Failed"}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <FilledCheckIcon className="text-primary size-10" />
      <p className="text-lg font-semibold">Authentication Successful</p>
      <p className="text-muted-foreground text-sm">
        This window will close in {countdown}s. Continuing with {platform}…
      </p>
    </div>
  )
}
