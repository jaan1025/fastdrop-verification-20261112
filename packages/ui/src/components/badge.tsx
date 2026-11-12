import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@repo/ui/lib/utils"

/**
 * Badge — a tinted pill: 10% tint background + solid hue text, one hue
 * per meaning (DESIGN-SYSTEM.md §3.5, §5). Used for roles, statuses, counts and
 * tags. `solid` is the filled count variant (e.g. nav counts on dark rows).
 */
const badgeVariants = cva(
  "type-body-compact inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full px-2 py-0.5 whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        primary: "bg-primary-tint text-primary", // Administrator
        success: "bg-success-tint text-success", // Decision-Maker / Complete / live
        warning: "bg-warning-tint text-warning", // Incomplete
        destructive: "bg-destructive-tint text-destructive", // Failed / danger
        member: "bg-member-tint text-member", // Member
        neutral: "text-foreground/60 bg-[rgb(0_0_0_/_0.10)]", // Viewer / generic
        solid: "bg-primary text-primary-foreground", // filled count
      },
    },
    defaultVariants: { variant: "neutral" },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  return (
    <Comp
      data-slot="badge"
      data-variant={variant ?? "neutral"}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>
