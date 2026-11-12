import type { ReactNode } from "react"
import { CliqueMark } from "@repo/components/illustrations"
import { AuthSplitPanel } from "@repo/components/auth-split-panel"

export interface LoginShellProps {
  /** Form heading — the product name, e.g. "Vesting Console". */
  title: string
  /** Muted subtitle under the heading, e.g. "Sign in to manage token distributions". */
  description: string
  /** Wallet sign-in entries (EVM + Solana). Rendered in a 2-column grid. */
  walletButtons: ReactNode
  /** API-key form (rendered under the "or continue with" divider). */
  apiKeyForm: ReactNode
  /** Terms-of-service consent line, pinned below the form. */
  tos?: ReactNode
  /** Blue brand-panel headline. */
  brandHeadline?: string
  /** Blue brand-panel body line. Defaults to the platform descriptor. */
  brandTagline?: string
  /** Brand-panel dashboard mock (the app's own `LoginDashboardMock`). */
  preview?: ReactNode
}

const DEFAULT_HEADLINE = "Everything in one place"
const DEFAULT_TAGLINE = "Secure token-distribution infrastructure"

// Shared split-screen login layout for the airdrop product apps — the Signal
// "brand threshold" (02-auth.md). Composes the design-system AuthSplitPanel:
// left = white form column (product heading + wallet buttons + API-key), right =
// blue brand panel with a gently floating dashboard-preview stack. Behaviour
// (handlers, permissions, ToS copy) stays in the app layer; this owns layout +
// brand only.
export function LoginShell({
  title,
  description,
  walletButtons,
  apiKeyForm,
  tos,
  brandHeadline = DEFAULT_HEADLINE,
  brandTagline = DEFAULT_TAGLINE,
  preview,
}: LoginShellProps) {
  return (
    <AuthSplitPanel
      mark={<CliqueMark className="size-[22px]" />}
      wordmark="Clique"
      headline={brandHeadline}
      body={brandTagline}
      preview={preview}
      contentAlign="center"
    >
      <div className="flex flex-col" style={{ gap: 32 }}>
        {/* Heading group — product name + subtitle, centered. */}
        <div className="flex flex-col text-center" style={{ gap: 12 }}>
          <h1 className="type-display-xl font-display text-[#000000]">{title}</h1>
          <p className="type-body-lg text-[rgba(0,0,0,0.60)]">{description}</p>
        </div>

        {/* Auth controls — wallet grid, divider, then the API-key form. */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3">{walletButtons}</div>
          <OrContinueDivider />
          {apiKeyForm}
        </div>

        {tos}
      </div>
    </AuthSplitPanel>
  )
}

// "Or continue with" hairline divider (02-auth.md § Divider row), mirroring the
// AuthForm divider so the login form speaks the same vocabulary.
function OrContinueDivider() {
  return (
    <div className="flex items-center gap-[10px]" style={{ height: 17 }}>
      <span className="h-px flex-1 bg-[rgba(0,0,0,0.10)]" />
      <span
        className="shrink-0 text-[rgba(0,0,0,0.60)]"
        style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 400 }}
      >
        Or continue with
      </span>
      <span className="h-px flex-1 bg-[rgba(0,0,0,0.10)]" />
    </div>
  )
}
