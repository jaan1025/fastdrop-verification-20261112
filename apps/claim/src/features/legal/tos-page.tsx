import { MarkdownViewer } from "@repo/markdown"
import { airdropToS } from "@repo/terms"

import { PageShell } from "~/components/page-shell"

// Airdrop Terms of Service legal page. Port of mono `(app)/(light)/_tos/page.tsx`.
// UNROUTED: mono's leading-underscore folder made it a private (non-routable)
// component. Kept as a component (not a file route), mono parity — present but
// not reachable at a URL by default; the legal text is linked externally via
// config.links.airdropTermsOfService.
export const ToSPage = () => (
  <PageShell>
    <MarkdownViewer className="container max-w-4xl py-12">{airdropToS}</MarkdownViewer>
  </PageShell>
)
