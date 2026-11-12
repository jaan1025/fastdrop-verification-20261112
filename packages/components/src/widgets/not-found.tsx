import type { ReactNode } from "react"
import { FileQuestion } from "lucide-react"

import { EmptyState } from "./empty-state"

/**
 * NotFound — the app-agnostic styled 404, wired as a router's
 * `defaultNotFoundComponent` so an unmatched URL renders this instead of the
 * router's bare built-in text. Full-viewport centered; composes {@link EmptyState}
 * and its action slot so the Home CTA stays with the message (not floated apart).
 *
 * Router-agnostic: the default action is a hard navigation to `homeHref` (works
 * under any router / outside any shell). Pass `onGoHome` to do an in-app SPA
 * navigation instead.
 */
export function NotFound({
  title = "404 — page not found",
  description = "The page you’re looking for doesn’t exist or has moved.",
  homeHref = "/",
  homeLabel = "Go home",
  onGoHome,
}: {
  title?: ReactNode
  description?: ReactNode
  homeHref?: string
  homeLabel?: string
  /** In-app navigation handler. Omit to hard-navigate to `homeHref`. */
  onGoHome?: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <EmptyState
        icon={<FileQuestion />}
        title={title}
        description={description}
        action={{
          label: homeLabel,
          onClick: onGoHome ?? (() => window.location.assign(homeHref)),
        }}
      />
    </div>
  )
}
