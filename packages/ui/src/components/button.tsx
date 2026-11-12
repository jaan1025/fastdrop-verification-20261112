import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@repo/ui/lib/utils"

/**
 * Button — the `variant` IS the intent (DESIGN-SYSTEM.md §3.4):
 *   primary     (blue)  — page-level actions: Upload, Invite, Start a review
 *   commit      (black) — in-dialog confirm / save / create: Create, Save, Move
 *   destructive (red)   — Delete / Remove, irreversible
 *   outline             — Cancel / secondary (always paired with a primary)
 *   tint                — soft promotions (sidebar "Start new review")
 *   ghost / link        — low-emphasis inline actions
 *
 * Square by default. Hover/focus are AUTHORED (§9) — the Figma source defines
 * no interactive states; only `disabled` is observed. Keeps the shadcn `variant`
 * prop name so the forked primitives (carousel, pagination, dialog, …) bind.
 */
const buttonVariants = cva(
  "focus-visible:ring-ring focus-visible:ring-offset-background inline-flex shrink-0 items-center justify-center gap-2 rounded-none text-sm leading-[18px] font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-disabled disabled:text-disabled-foreground",
        commit:
          "bg-commit text-commit-foreground hover:bg-commit-hover disabled:bg-disabled disabled:text-disabled-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover disabled:bg-disabled disabled:text-disabled-foreground",
        outline:
          "border-border-strong bg-background text-foreground hover:bg-surface disabled:text-disabled-foreground border",
        tint: "bg-primary-tint-2 text-primary disabled:bg-disabled disabled:text-disabled-foreground hover:bg-[rgb(38_87_255_/_0.3)]",
        ghost: "text-foreground disabled:text-disabled-foreground hover:bg-[rgb(0_0_0_/_0.05)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        md: "h-10 px-4 has-[>svg]:px-3.5", // 40px — modal / page primary
        sm: "h-9 px-3.5 has-[>svg]:px-3", // 36px — toolbar / dense
        icon: "size-9", // 36px
        "icon-sm": "size-8", // 32px
        // Tight inline affordance (copy): drop the glyph to 14px so it hugs the
        // 24px button instead of floating in the default 16px padding.
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3.5", // 24px → 14px
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? "primary"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>
