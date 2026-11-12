import { Plus } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"

export interface AddItemDashedButtonProps {
  label: string
  onClick?: () => void
  className?: string
}

/**
 * AddItemDashedButton — full-width dashed-border placeholder that acts as
 * an "add" affordance at the tail of a list/grid.
 * Figma: edit-mode record detail (606:23350) → "+ Add contract" button
 * (node 606:23636): 38px tall, 1px dashed rgba(0,0,0,0.2) border on white,
 * 12px Plus + 14px black label, 4px gap.
 */
export function AddItemDashedButton({ label, onClick, className }: AddItemDashedButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[38px] w-full items-center justify-center gap-1 px-4",
        "border-border-strong border border-dashed",
        "type-body text-foreground",
        "transition-colors hover:bg-[var(--hover-neutral)]",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
        className,
      )}
    >
      <Plus className="size-3 shrink-0" />
      {label}
    </button>
  )
}
