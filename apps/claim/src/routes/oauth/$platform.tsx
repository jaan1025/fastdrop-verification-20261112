import { createFileRoute } from "@tanstack/react-router"

import { OAuthCallback } from "~/features/oauth/oauth-callback"

// OAuth popup landing page. Port of mono `(light)/oauth/[platform]/page.tsx`
// (async server page awaiting params) + its client `Callback`. In TanStack Start
// the param + `?error` search are read client-side. This is the terminal page a
// social-login popup lands on after the provider redirects back. Present but not
// wired into the claim flow (mono parity).
export const Route = createFileRoute("/oauth/$platform")({
  validateSearch: (search: Record<string, unknown>): { error?: string } => ({
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: OAuthCallbackRoute,
})

function OAuthCallbackRoute() {
  const { platform } = Route.useParams()
  const { error } = Route.useSearch()

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="bg-card flex h-[240px] w-full max-w-md items-center justify-center rounded-2xl border sm:h-[400px]">
        <OAuthCallback platform={platform} error={error} />
      </div>
    </div>
  )
}
