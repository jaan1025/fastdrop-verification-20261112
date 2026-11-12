import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@repo/ui/lib/utils"

function Page({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="page" className={cn("flex h-full flex-col", className)} {...props} />
}

function PageHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header"
      className={cn(
        // Full-bleed header-band hairline: the negative inline margin spans the
        // container-cap gutter + PageContent's p-6 (measured via cqw against the
        // scroll region), so the border-b meets the region edges at any width;
        // the symmetric padding pushes the text back to the container column.
        "@container/page-header mx-[calc((100%-100cqw)/2)] grid auto-rows-min grid-rows-[auto_auto] items-start gap-x-3 gap-y-1.5 border-b px-[calc((100cqw-100%)/2)] pb-6 has-data-[slot=page-action]:grid-cols-[1fr_auto]",
        className,
      )}
      {...props}
    />
  )
}

/**
 * Heading slot.
 *
 *   - Single React element child → `Slot.Root` merges the heading styles
 *     onto that element. Use when the caller wants a custom wrapper
 *     (e.g. `<div className="flex …">…</div>`).
 *   - Anything else (string, number, array, fragment) → `<h1>` with
 *     children spread in.
 */
function PageTitle({ className, children, ...props }: React.ComponentProps<"h1">) {
  // Page titles step down one size on mobile (20px) and return to 24px at sm+.
  const headingClass = cn("font-display text-xl font-medium tracking-tight sm:text-2xl", className)

  if (React.isValidElement(children)) {
    return (
      <Slot.Root
        data-slot="page-title"
        className={headingClass}
        {...(props as React.ComponentProps<"div">)}
      >
        {children}
      </Slot.Root>
    )
  }

  return (
    <h1 data-slot="page-title" className={headingClass} {...props}>
      {children}
    </h1>
  )
}

/**
 * Subtitle / description slot.
 *
 *   - Single React element child → `Slot.Root` merges the description
 *     styles onto that element. Use when the children include block
 *     content (`<button>`, `<div>`) that's invalid inside `<p>`.
 *   - Anything else (string, number, array, fragment) → `<p>` with
 *     children spread in.
 */
function PageDescription({ className, children, ...props }: React.ComponentProps<"p">) {
  const descClass = cn("text-muted-foreground text-sm", className)

  if (React.isValidElement(children)) {
    return (
      <Slot.Root
        data-slot="page-description"
        className={descClass}
        {...(props as React.ComponentProps<"div">)}
      >
        {children}
      </Slot.Root>
    )
  }

  return (
    <p data-slot="page-description" className={descClass} {...props}>
      {children}
    </p>
  )
}

function PageAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 flex items-center gap-2 justify-self-end",
        className,
      )}
      {...props}
    />
  )
}

function PageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="page-content" className="@container/page flex-1 overflow-auto">
      <div className={cn("container mx-auto space-y-6 p-6", className)} {...props} />
    </div>
  )
}

function PageFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="page-footer" className="border-t">
      <div
        className={cn("container mx-auto flex items-center justify-between px-6 py-4", className)}
        {...props}
      />
    </div>
  )
}

export { Page, PageHeader, PageTitle, PageDescription, PageAction, PageContent, PageFooter }
