import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

/**
 * Textarea — auto-sizing multi-line input. Shares the Input token set: square
 * (radius-0), 1px #dbdbdb border (`--input`), white fill, `px-3 py-2`,
 * `type-body-compact` text, muted placeholder — byte-identical to the Input
 * primitive's resting contract. Min-height 64px; grows with content via
 * `field-sizing-content`. The Signal source DOES draw it (Intake wizard
 * 727:5609/5613/5617/5657 + Process detail 606:23806/23810/23814/23847): a
 * top-aligned (`items-start`) box, ~100px resting, holding wrapped multi-line
 * text — distinct from the 42px vertically-centered single-line Input on the
 * same screens. The consuming form sets the resting height (e.g. min-h-[100px]
 * for the intake/description fields). Focus/error states are AUTHORED (§9) —
 * the source draws none. A borderless `bg-surface` read/display variant appears
 * in the detail screen (606:23806); like Input, that read-mode rendering is a
 * consumer/Field-widget concern, not forked into this primitive.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input bg-background type-body-compact text-foreground selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground field-sizing-content min-h-16 w-full rounded-none border px-3 py-2 transition-colors outline-none",
        "focus-visible:border-primary focus-visible:ring-primary focus-visible:ring-1",
        "aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive",
        "disabled:text-muted-foreground disabled:cursor-not-allowed disabled:bg-[#f0f0f0]",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
