import { cn } from "@repo/ui/lib/utils"
import { Input } from "@repo/ui/components/input"

/**
 * SendCodeInput — inline verification-code request field.
 *
 * Figma "Change Email" modal — idle node 805:32273, cooldown node 805:32296.
 *
 * Anatomy (h-9):
 *   ┌─────────────────────────────────────────────────────┐
 *   │ Code sent to your email:        j***@acme.com        │  ← label row (justify-between)
 *   ├──────────────────────────────┬──────────────────────┤
 *   │ <Input> border-0 ring-0      │  Send Verification   │  ← 14px Funnel Sans, underline, text-primary
 *   └──────────────────────────────┴──────────────────────┘
 *   wrapper: flex h-9 border border-[rgba(0,0,0,.1)]
 *
 * Label row (Figma 805:32274): `justify-between` — a black `label` on the left
 * and the masked target at opacity-60 on the right, both Funnel Sans 14/18.
 *
 * Cooldown (Figma 805:32302): CTA shows the countdown at opacity-40 with NO
 * underline and NO primary colour (just dimmed black), pointer-events-none.
 * Caller controls timer state — this component takes `remaining` (seconds) and
 * `onSend` so it stays pure (no internal Date.now).
 *
 * Public API:
 *   value, onChange                — controlled input value
 *   placeholder?                   — input placeholder
 *   label?                         — left side of the label row (e.g. "Code sent to your email:")
 *   maskedTarget?                  — e.g. "j***@acme.com"; right side of the label row at opacity-60
 *   ctaLabel?="Send code"          — idle CTA text (Figma uses "Send Verification")
 *   remaining?                     — seconds left on cooldown (0 = idle)
 *   onSend?                        — called when CTA is clicked (idle state only)
 *   className?
 */

export interface SendCodeInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  maskedTarget?: string
  ctaLabel?: string
  remaining?: number
  onSend?: () => void
  className?: string
}

function SendCodeInput({
  value,
  onChange,
  placeholder,
  label,
  maskedTarget,
  ctaLabel = "Send code",
  remaining = 0,
  onSend,
  className,
}: SendCodeInputProps) {
  const cooling = remaining > 0

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label || maskedTarget ? (
        <div className="type-body-compact text-foreground flex items-center justify-between">
          {label ? <span>{label}</span> : <span />}
          {maskedTarget ? <span className="opacity-60">{maskedTarget}</span> : null}
        </div>
      ) : null}

      {/* wrapper: flex h-9 border rgba(0,0,0,.1) */}
      <div className="flex h-9 items-center border border-[rgba(0,0,0,.1)]">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-full flex-1 border-0 ring-0 focus-visible:border-0 focus-visible:ring-0"
        />

        {/* inline CTA — shrink-0 pr-3 14px Funnel Sans, underline + text-primary when idle */}
        <button
          type="button"
          onClick={cooling ? undefined : onSend}
          disabled={cooling}
          className={cn(
            "type-body-compact shrink-0 cursor-pointer pr-3 select-none",
            cooling ? "pointer-events-none opacity-40" : "text-primary underline hover:opacity-80",
          )}
          aria-live="polite"
          aria-label={cooling ? `Resend available in ${remaining} seconds` : ctaLabel}
        >
          {cooling ? `${ctaLabel} (${remaining}s)` : ctaLabel}
        </button>
      </div>
    </div>
  )
}

export { SendCodeInput, SendCodeInput as default }
