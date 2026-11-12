import { MarkdownViewer } from "@repo/markdown"
import { privacyPolicy } from "@repo/terms"

import { PageShell } from "~/components/page-shell"

// Privacy Policy legal page. Port of mono `(app)/(light)/_privacy-policy/page.tsx`.
// UNROUTED: mono's leading-underscore folder made it a private (non-routable)
// component. Kept here as a component (not a file route) so it is available to
// mount if a delivery decides to route it, without adding a URL by default —
// faithful to mono's "present but unreachable" shape.
export const PrivacyPolicyPage = () => (
  <PageShell>
    <MarkdownViewer className="container max-w-4xl py-12">{privacyPolicy}</MarkdownViewer>
  </PageShell>
)
