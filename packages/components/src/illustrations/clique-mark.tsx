import { cn } from "@repo/ui/lib/utils"

// Clique brand mark — the geometric "C". Rendered from each app's
// `public/clique-mark.png` (the 600×600 source of the site favicon): Clique
// ships no vector mark, and a 600px raster stays crisp at logo scale. Every app
// that renders <LoginShell> must include `public/clique-mark.png`.
export interface CliqueMarkProps {
  className?: string
}

export function CliqueMark({ className }: CliqueMarkProps) {
  return (
    <img
      src="/clique-mark.png"
      alt="Clique"
      width={600}
      height={600}
      draggable={false}
      className={cn("size-10 select-none", className)}
    />
  )
}
