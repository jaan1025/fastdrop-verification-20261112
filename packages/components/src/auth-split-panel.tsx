import type { ReactNode } from "react"
import { cn } from "@repo/ui/lib/utils"
import { LoginDashboardMock } from "./login-dashboard-mock"

/**
 * AuthSplitPanel — two-column auth shell (02-auth.md § Split-screen layout).
 *
 * Even 1:1 split (Figma is ~760/734 — treat as 50/50). Left: white form column
 * (form centered, capped at 464px). Right: blue brand panel (bg-primary) with
 *         headline + body copy + a layered dashboard-preview stack + dot-grid bg.
 * Top   : 64px bar (bg #fff, 1px bottom border) with logo at x=24.
 *
 * Slots: children (left form content), headline, body, mark, wordmark, preview.
 */
export function AuthSplitPanel({
  children,
  headline = "Everything in one place",
  body = "Tokenomics, team, contracts, and on-chain behaviour — all the diligence an exchange needs, replacing the deck, the spreadsheets, and the back-and-forth.",
  mark,
  wordmark = "Acme",
  preview,
  contentAlign = "top",
}: {
  children: ReactNode
  headline?: ReactNode
  body?: ReactNode
  /** Top-bar logo mark. Defaults to a placeholder square. */
  mark?: ReactNode
  /** Top-bar wordmark text. Defaults to the de-branded "Acme". */
  wordmark?: ReactNode
  /** Front-layer content of the brand-panel dashboard stack. Defaults to a
   * generic `LoginDashboardMock`; apps pass their own domain-specific mock. */
  preview?: ReactNode
  /** Vertical alignment of the left form column. Default "top". */
  contentAlign?: "top" | "center"
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* ── Top bar (64px) ────────────────────────────────────────────── */}
      <header className="flex h-16 shrink-0 items-center border-b border-[rgba(0,0,0,0.15)] bg-white px-6">
        <div className="flex items-center gap-2">
          {/* 22×22 logo mark */}
          {mark ?? (
            <span className="bg-primary text-primary-foreground grid size-[22px] shrink-0 place-items-center text-[11px] font-bold">
              S
            </span>
          )}
          {/* Wordmark — Funnel Display Medium 16/24 */}
          <span className="type-display-3 text-[#0a0a0a]">{wordmark}</span>
        </div>
      </header>

      {/* ── Body (even 1:1 split — Figma ~760/734) ────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* Left column — white, 50%, form capped 464px (top- or center-aligned) */}
        <div
          className={cn(
            "flex min-h-0 flex-1 basis-0 flex-col overflow-y-auto bg-white",
            contentAlign === "center" && "justify-center",
          )}
        >
          <div className="mx-auto w-full max-w-[464px] px-10 py-[60px]">{children}</div>
        </div>

        {/* 1px vertical divider (desktop only — brand panel hides below lg) */}
        <div className="hidden w-px shrink-0 bg-[rgba(0,0,0,0.10)] lg:block" />

        {/* Right column — blue brand panel, 50% (mirrors the left half). A flex
            column so the headline and the preview never overlap (the Figma frame
            is 982 px tall; real viewports are shorter). Hidden below lg. */}
        <div className="bg-primary relative hidden min-w-0 flex-1 basis-0 flex-col overflow-hidden lg:flex">
          {/* Dot-grid decorative bg */}
          <BrandDotGrid />

          {/* Headline + body — top of the panel, in normal flow + centered. */}
          <div className="relative z-10 shrink-0 px-6 pt-[12%] text-center">
            {/* Funnel Display Bold 32/40 white */}
            <p className="type-display-xl text-white" style={{ fontSize: 32, lineHeight: "40px" }}>
              {headline}
            </p>
            {/* Funnel Sans Regular 16/24 white @80% (type-body-lg) */}
            <p className="type-body-lg mx-auto mt-6 max-w-[560px] text-white/80">{body}</p>
          </div>

          {/* Dashboard preview — fills the space BELOW the headline and anchors to
              the bottom (top clips here, never over the copy). */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <DashboardPreviewStack preview={preview} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Internal sub-components ────────────────────────────────────────────────

/** Decorative dot-grid — 734×581, centered at ~75% x/50% y of the panel. */
function BrandDotGrid() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="brand-dot-grid"
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.5" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#brand-dot-grid)" />
    </svg>
  )
}

// Injected preview styles. (1) Gentle up-down float — each layer bobs at a
// different amplitude/phase so the stack reads as parallax depth; animates
// `transform`, gated behind prefers-reduced-motion. (2) Fit-to-panel scale —
// the stack is authored at a fixed 692 px; the brand panel is ≈ half the
// viewport, so on narrower viewports we scale the stack down (toward
// bottom-center, via the `scale` property so it composes with the float's
// `transform`). Written as real CSS — NOT Tailwind utilities — because arbitrary
// breakpoint+scale classes authored in a package source are not reliably emitted
// by a consuming app's Tailwind scan.
const PREVIEW_STYLES = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes clq-float-back   { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
  @keyframes clq-float-middle { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-9px) } }
  @keyframes clq-float-front  { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-13px) } }
  .clq-float-back   { animation: clq-float-back 7s ease-in-out infinite }
  .clq-float-middle { animation: clq-float-middle 6.2s ease-in-out infinite; animation-delay: -0.8s }
  .clq-float-front  { animation: clq-float-front 5.6s ease-in-out infinite; animation-delay: -1.6s }
}
.clq-preview-stack { scale: 1 }
@media (max-width: 1499px) { .clq-preview-stack { scale: 0.9 } }
@media (max-width: 1339px) { .clq-preview-stack { scale: 0.78 } }
@media (max-width: 1179px) { .clq-preview-stack { scale: 0.64 } }
`

/**
 * Three layered dashboard cards (02-auth.md § Right brand panel). Back → middle →
 * front, each slightly taller and shifted down, each gently floating (see
 * FLOAT_KEYFRAMES). The back/middle are frosted peek layers for depth; the FRONT
 * layer renders the real preview — the app's `LoginDashboardMock` (or a generic
 * one), so it reads like an actual product screen rather than a placeholder.
 */
function DashboardPreviewStack({ preview }: { preview?: ReactNode }) {
  return (
    /* Anchor point bottom-center. The card is authored at a fixed 692px; on
       narrower panels it would overflow, so `.clq-preview-stack` (PREVIEW_STYLES)
       scales it down toward bottom-center to fit. */
    <div className="clq-preview-stack pointer-events-none absolute bottom-0 left-1/2 w-[692px] origin-bottom -translate-x-1/2">
      <style>{PREVIEW_STYLES}</style>
      {/* Back — frosted peek layer. X-centered via margin so `transform` is free
          for the float. */}
      <div
        className="clq-float-back absolute bottom-0 left-1/2 ml-[-320px] w-[640px] overflow-hidden bg-white/10 backdrop-blur-sm"
        style={{ height: 475, bottom: 82 }}
      />
      {/* Middle — frosted peek layer, drop-shadow */}
      <div
        className="clq-float-middle absolute left-1/2 ml-[-334.5px] w-[669px] overflow-hidden bg-white/15"
        style={{
          height: 497,
          bottom: 56,
          boxShadow: "0px -4px 18px 0px rgba(0,0,0,0.10)",
        }}
      />
      {/* Front — the real product mock, lifted off the panel */}
      <div
        className="clq-float-front relative w-[692px] overflow-hidden bg-white"
        style={{
          height: 514,
          boxShadow: "0px -8px 30px 0px rgba(0,0,0,0.18)",
        }}
      >
        {preview ?? <LoginDashboardMock />}
      </div>
    </div>
  )
}
