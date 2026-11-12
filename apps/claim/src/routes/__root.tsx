import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router"
import type { QueryClient } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@repo/ui/components/sonner"
import { GTagScript } from "@repo/gtag"
import { GlobalError } from "@repo/sentry/error-boundary"
import { config } from "@repo/config"

import { domain } from "~/lib/env"
import appCss from "~/styles/app.css?url"

// OG image is served from /public; when VITE_DOMAIN is set we resolve it to an
// absolute URL (mono's `metadataBase`). Falls back to the relative path. NOTE:
// mono referenced /images/opengraph-image.png but never shipped it — parity kept;
// the delivery workflow supplies the asset.
const OG_IMAGE_PATH = "/images/opengraph-image.png"
const resolvedDomain = domain()
const ogImageUrl = resolvedDomain
  ? new URL(OG_IMAGE_PATH, resolvedDomain).toString()
  : OG_IMAGE_PATH

// Replaces mono's Next `generateMetadata`. Title/description/keywords + OpenGraph
// come from @repo/config (the per-project customization surface).
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: config.meta.title },
      { name: "description", content: config.meta.description },
      { name: "keywords", content: config.meta.keywords },
      { property: "og:title", content: config.meta.title },
      { property: "og:description", content: config.meta.description },
      { property: "og:image", content: ogImageUrl },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
  errorComponent: ({ error, reset }) => <GlobalError error={error} reset={reset} />,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // suppressHydrationWarning: next-themes toggles the class on <html> client-
    // side; the SSR markup ships with `dark` (defaultTheme) so the two agree, but
    // next-themes still mutates the attribute post-hydration.
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <GTagScript />
        <HeadContent />
      </head>
      <body className="bg-background text-foreground min-h-dvh font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark">
          {children}
          <Toaster />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
