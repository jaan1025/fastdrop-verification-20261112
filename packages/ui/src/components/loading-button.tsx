import * as React from "react"
import { Loader2Icon } from "lucide-react"

import { Button } from "@repo/ui/components/button"

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  /** When true: show a leading spinner and disable the button. */
  loading?: boolean
  /** Optional label shown while `loading` (replaces children). */
  loadingText?: React.ReactNode
}

/**
 * `Button` with a built-in in-flight state: while `loading`, it shows a leading
 * spinner and is disabled. Forwards every `Button` prop (variant, size, type,
 * onClick, className, …). The spinner inherits the button's size via Button's
 * own `[&_svg]` rule, so it scales with `size`.
 */
function LoadingButton({
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={loading || disabled} {...props}>
      {loading ? <Loader2Icon className="animate-spin" /> : null}
      {loading && loadingText !== undefined ? loadingText : children}
    </Button>
  )
}

export { LoadingButton }
export type { LoadingButtonProps }
