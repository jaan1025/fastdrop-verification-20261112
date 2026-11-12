import { AlertTriangleIcon, HomeIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { Card, CardContent } from "@repo/ui/components/card"
import { PageTitle } from "@repo/ui/components/page"

/** The diagnostic block the route owns and passes in — never synthesized from
 *  `window` / `new Date()` inside the component, so it stays pure + SSR-safe. */
export interface ErrorDiagnostics {
  /** Current route path (route reads it; component never touches `window`). */
  pathname?: string
  /** ISO timestamp captured by the caller at error time. */
  timestamp?: string
}

export interface ErrorFallbackProps {
  error?: string
  details?: string
  /** Pathname + timestamp shown in the `<pre>` block; omitted → no diagnostics. */
  diagnostics?: ErrorDiagnostics
  onRetry?: () => void
  onGoHome?: () => void
}

/**
 * Full-screen error-boundary fallback: icon + title + details + an optional code
 * block (caller-supplied diagnostics) + Retry / Go Home actions. Wired as the
 * `errorComponent` of each app's root route. The route owns the diagnostics
 * (pathname + timestamp) and passes them in — the component never reads `window`
 * or `new Date()`, so it is pure and SSR-safe by construction.
 */
export function ErrorFallback({
  error = "Something went wrong",
  details = "An unexpected error occurred while loading this page. Please try again or contact support if the problem persists.",
  diagnostics,
  onRetry,
  onGoHome,
}: ErrorFallbackProps) {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-4">
          <div className="bg-destructive/10 mx-auto flex size-16 items-center justify-center">
            <AlertTriangleIcon className="text-destructive size-8" />
          </div>
          <div className="space-y-2">
            <PageTitle>{error}</PageTitle>
            <p className="text-muted-foreground text-sm">{details}</p>
          </div>
        </div>

        {diagnostics && (
          <Card>
            <CardContent className="p-4">
              <pre className="text-muted-foreground max-h-[120px] overflow-auto text-left font-mono text-xs">
                {[
                  `Error: ${error}`,
                  diagnostics.timestamp && `Timestamp: ${diagnostics.timestamp}`,
                  diagnostics.pathname && `Page: ${diagnostics.pathname}`,
                ]
                  .filter(Boolean)
                  .join("\n")}
              </pre>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={onGoHome}>
            <HomeIcon className="mr-2 size-4" />
            Go Home
          </Button>
          <Button onClick={onRetry}>
            <RefreshCwIcon className="mr-2 size-4" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}
