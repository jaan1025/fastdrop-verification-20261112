import { useLocation } from "@tanstack/react-router"
import { config } from "@repo/config"

// Discord support banner shown on every page EXCEPT the landing (`/`). Port of
// mono `components/banner.tsx` (keyed on Next `usePathname()`; here TanStack Router
// location). Renders nothing when no Discord link is configured.
export const Banner = () => {
  const { pathname } = useLocation()
  const discordLink = config.links.discord

  if (pathname === "/" || !discordLink) {
    return null
  }

  return (
    <div className="bg-primary/15 text-primary flex min-h-12 items-center justify-center">
      <div className="px-4 py-2 text-sm leading-tight">
        Please visit our{" "}
        <a
          href={discordLink}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline"
        >
          Discord
        </a>{" "}
        if you have any questions or need further support.
      </div>
    </div>
  )
}
