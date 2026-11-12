import { useState } from "react"
import { toast } from "sonner"
import { CheckIcon, CopyIcon } from "lucide-react"
import { MarkdownViewer } from "@repo/markdown"
import { captureException } from "@repo/sentry"
import { getClient } from "@sentry/tanstackstart-react"

import { resolveErrorReport } from "./error-report"
import { splitEventId } from "./event-id"

// App-wide toast facade over sonner. The four helpers render Markdown bodies and
// funnel every user-facing error through `resolveErrorReport`, so Sentry capture
// and the copyable reference id live in exactly one place. The host must mount a
// sonner <Toaster /> at the app root, or these calls silently no-op.

// A single injectable port for the pure `resolveErrorReport`. `getClient` comes
// from the SDK directly (the `@repo/sentry` facade doesn't re-export it — same as
// that package's own error boundary); `captureException` goes through the facade.
const sentryPort = { getClient, captureException }

/**
 * Copyable Sentry reference id. Shows the first 8 chars ("Error ID: xxxxxxxx")
 * but copies the FULL id, with a 2s "Copied!" confirmation state.
 */
const CopyableRefId = ({ eventId }: { eventId: string }) => {
  const [copied, setCopied] = useState(false)
  const { display, full } = splitEventId(eventId)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(full)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard denied (insecure context / permissions) — leave the button as
      // the ref id; there is nothing user-actionable to surface.
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="mt-1 inline-flex cursor-pointer items-center gap-1 font-mono text-xs opacity-50 transition-opacity hover:opacity-80"
    >
      {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
      {copied ? "Copied!" : `Error ID: ${display}`}
    </button>
  )
}

// Every toast body is Markdown. 'toast-md' is the styling hook the host targets.
const md = (content: string) => <MarkdownViewer className="toast-md">{content}</MarkdownViewer>

/**
 * Error toast. Extracts a user-safe message, and for an UNEXPECTED error with an
 * active Sentry client, captures it and surfaces a copyable reference id.
 * No-ops on a falsy error. 10s duration (longer than the others, so the user can
 * read and copy the id).
 */
export const toastError = (error: unknown) => {
  const report = resolveErrorReport(error, sentryPort)
  if (!report) return

  toast.error(md(report.message), {
    description: report.eventId ? <CopyableRefId eventId={report.eventId} /> : undefined,
    duration: 10_000,
  })
}

export const toastSuccess = (message: string) => {
  toast.success(md(message), { duration: 5_000 })
}

export const toastWarn = (message: string) => {
  toast.warning(md(message), { duration: 5_000 })
}

export const toastInfo = (message: string) => {
  toast.info(md(message), { duration: 5_000 })
}
