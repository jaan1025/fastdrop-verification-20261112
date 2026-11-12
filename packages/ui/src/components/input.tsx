import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

/**
 * Input — 36px, square, 1px border. Focus shows a primary edge (border +
 * 1px ring, no soft glow); `aria-invalid` turns it red; disabled goes #f0f0f0.
 * Labels sit above with a 4px gap (compose with a <label> or the Field widget).
 * Focus/error states are AUTHORED (§9) — the Figma source defines none.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input bg-background type-body-compact text-foreground selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground h-9 w-full min-w-0 rounded-none border px-3 py-2 transition-colors outline-none",
        "focus-visible:border-primary focus-visible:ring-primary focus-visible:ring-1",
        "aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive",
        "disabled:text-muted-foreground disabled:cursor-not-allowed disabled:bg-[#f0f0f0]",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
