import type { ComponentProps } from "react"
import { LoadingButton } from "@repo/components/widgets/loading-button"
import { Button } from "@repo/ui/components/button"
import { cn } from "@repo/ui/lib/utils"

const tones = {
  primary: "hover:bg-primary/90",
  outline: "border-input bg-transparent hover:border-input/70 hover:bg-transparent",
  destructive: "bg-destructive/25 text-destructive hover:bg-destructive/20",
  ghost: "hover:bg-accent hover:text-accent-foreground",
}

export function ClaimButton({
  asChild, className, variant = "primary", size = "md", loading, loadingText, ...props
}: Omit<ComponentProps<typeof LoadingButton>, "variant"> & { variant?: keyof typeof tones }) {
  const style = cn("cursor-pointer rounded-md shadow-xs", size === "md" && "h-11 py-2", tones[variant], className)
  if (asChild) return <Button asChild variant={variant} size={size} className={style} {...props} />
  return <LoadingButton variant={variant} size={size} className={style} loading={loading} loadingText={loadingText} {...props} />
}
