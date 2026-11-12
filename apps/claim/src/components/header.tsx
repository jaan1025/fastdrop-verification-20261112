import { Link } from "@tanstack/react-router"
import { ProjectIcon } from "@repo/icons"

// Top-left brand. Port of mono `components/header.tsx`: `<Link href="/">`
// wrapping `<ProjectIcon>`. mono had a commented-out raster `<Image>` fallback;
// the ProjectIcon (per-project SVG emblem) is the shipped mark.
export const Header = () => (
  <header className="flex h-16 items-center justify-start px-6 sm:h-20">
    <Link to="/" aria-label="Home">
      <ProjectIcon className="h-[44px] w-[134px]" />
    </Link>
  </header>
)
