import { cn } from "@repo/ui/lib/utils"

/**
 * Every icon renders its raw <svg> inside a Radix Slot and merges a per-icon
 * default class (always `size-6`, plus a semantic default color on some status
 * icons) with the caller-supplied `className`. Later Tailwind classes win via
 * `cn` (tailwind-merge), so callers can override size/color from the outside.
 */
export const mergeIconClass = (defaultClass: string, className: string | undefined): string =>
  cn(defaultClass, className)
