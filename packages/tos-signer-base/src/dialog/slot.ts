// The consent-dialog SLOT contract: the props any app-supplied ToS consent
// surface must accept so the headless host can drive it. Pure type only — NO
// `@repo/ui`, NO `react-markdown` (the concrete dialog lives in
// `@repo/components`; this package is headless, charter ⊖ ui dep). This
// decouples the host from any one dialog implementation so an app can substitute
// its own consent UX (analysis High #1). Zero runtime deps.

/** Slot contract for a consent dialog; an app maps `ToSSignerHostState` onto these props. */
export interface ToSDialogProps {
  /** Whether the consent dialog is visible. */
  open: boolean
  /** Signing in progress; disables actions and shows a "Signing…" affordance. */
  pending?: boolean
  /** Raw ToS markdown to render (defaults to ''). */
  tosContent: string
  /** Fired on Cancel or dismiss. */
  onCancel?: () => void
  /** Fired on Accept (a concrete dialog gates this on `useScrolledToBottom`). */
  onConfirm?: () => void
}
