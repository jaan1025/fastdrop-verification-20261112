import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@repo/ui/lib/utils"
import { Input } from "@repo/ui/components/input"

/**
 * PasswordInput — composable password field with inline show/hide toggle.
 * Spec: Figma node 805:12358.
 * Wrapper: flex h-9 border rgba(0,0,0,.1) bg-background.
 * Inner Input: border-0, pr-9, ring-0 (no focus ring on the inner element).
 * Toggle: absolute right-3 (12px, matching Figma container px), 20×20,
 * Eye/EyeOff at 16px, aria Show/Hide.
 */
interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "type" | "onChange"> {
  onChange?: (value: string) => void
}

function PasswordInput({ id, className, onChange, ...props }: PasswordInputProps) {
  const [shown, setShown] = React.useState(false)

  return (
    <div
      className={cn(
        "bg-background relative flex h-9 items-center border",
        "border-[rgba(0,0,0,.1)]",
        className,
      )}
    >
      <Input
        id={id}
        type={shown ? "text" : "password"}
        className="h-full w-full rounded-none border-0 pr-9 shadow-none ring-0 focus-visible:border-0 focus-visible:ring-0"
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        {...props}
      />
      <button
        type="button"
        aria-label={shown ? "Hide password" : "Show password"}
        onClick={() => setShown((v) => !v)}
        className="text-muted-foreground hover:text-foreground absolute right-3 flex size-5 shrink-0 items-center justify-center transition-colors"
        tabIndex={-1}
      >
        {shown ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
      </button>
    </div>
  )
}

export { PasswordInput }
export type { PasswordInputProps }
