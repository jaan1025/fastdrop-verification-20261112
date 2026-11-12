import { cn } from "@repo/ui/lib/utils"
import { PoweredByClique } from "@repo/components/widgets/powered-by-clique"
import { config } from "@repo/config"

export interface FooterProps {
  className?: string
}

// Legal links + "Powered by Clique" mark. Port of mono `components/footer.tsx`
// (which imported `<PoweredByClique>` from @airdrop/components — the widget exists
// here at @repo/components/widgets/powered-by-clique). Links render only when the
// matching config href is set (mono filtered to truthy hrefs).
export const Footer = ({ className }: FooterProps) => {
  const { links } = config
  const partnerName = config.name || "Company"

  const linkItems = [
    { label: "Privacy Policy", href: links.privacyPolicy },
    { label: "Airdrop Terms of Service", href: links.airdropTermsOfService },
    { label: "General Terms of Service", href: links.termsOfService },
  ].filter((link): link is { label: string; href: string } => !!link.href)

  return (
    <footer className={cn("flex flex-col gap-6 px-4 py-8 sm:border-t", className)}>
      <PoweredByClique iconClassName="w-20 h-5.5 text-foreground" className="w-fit" />
      <div className="bg-border h-px w-full sm:hidden" />
      <div className="flex flex-col justify-between gap-y-3 sm:flex-row">
        <p className="order-2 sm:order-1">
          © {new Date().getFullYear()} {partnerName}. All rights reserved.
        </p>
        {linkItems.length ? (
          <div className="order-1 flex flex-wrap gap-x-6 gap-y-3 sm:order-2">
            {linkItems.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </footer>
  )
}
