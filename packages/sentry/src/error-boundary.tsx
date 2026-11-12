import { captureException, getClient } from "@sentry/tanstackstart-react"
import { useEffect, useState } from "react"

// Styled global error UI, ported from mono's `GlobalError` (look preserved
// verbatim: centered column, "Something went wrong" heading, muted body copy,
// copyable 8-char Error ID, blue "Try again" button).
//
// Two deliberate divergences from mono for TanStack Start:
//   1. No `<html><body>` wrapper. Mono needed it because Next app-router's
//      `global-error.tsx` must supply the whole document. TanStack Start error
//      boundaries render inside the existing document, so the wrapper would nest
//      a second <html> — this component renders just the error panel.
//   2. `reset` is optional. TanStack Router error components expose a `reset`
//      via the error component props; when absent the "Try again" button falls
//      back to a full reload.

export interface GlobalErrorProps {
  error: Error & { digest?: string }
  /** Retry handler from the router error boundary; falls back to page reload. */
  reset?: () => void
}

function CopyableRefId({ eventId }: { eventId: string }) {
  const [copied, setCopied] = useState(false)
  // UI shows the first 8 chars; copy writes the full eventId (same convention as
  // the toast package) so support can correlate against the full Sentry event.
  const refId = eventId.slice(0, 8)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(eventId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard denied (insecure context / no permission) — leave label as-is.
    }
  }

  const iconStyle = {
    width: 12,
    height: 12,
    verticalAlign: "middle" as const,
    marginRight: 4,
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        fontFamily: "monospace",
        fontSize: "0.75rem",
        color: "#999",
        background: "none",
        border: "none",
        cursor: "pointer",
        marginBottom: "1rem",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {copied ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={iconStyle}
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={iconStyle}
        >
          <rect width={14} height={14} x={8} y={8} rx={2} />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
      )}
      {copied ? "Copied!" : `Error ID: ${refId}`}
    </button>
  )
}

export function GlobalError({ error, reset }: GlobalErrorProps) {
  const [eventId, setEventId] = useState<string>()

  useEffect(() => {
    // Only capture when a Sentry client is active — keeps the boundary inert on
    // unconfigured deployments (no DSN ⇒ no client ⇒ no capture).
    if (!getClient()) return
    const id = captureException(error)
    setEventId(id)
  }, [error])

  const handleReset = () => {
    if (reset) {
      reset()
      return
    }
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Something went wrong</h1>
      <p
        style={{
          color: "#666",
          marginBottom: "1rem",
          textAlign: "center",
        }}
      >
        An unexpected error occurred. Our team has been notified.
      </p>
      {eventId && <CopyableRefId eventId={eventId} />}
      <button
        onClick={handleReset}
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        Try again
      </button>
    </div>
  )
}
