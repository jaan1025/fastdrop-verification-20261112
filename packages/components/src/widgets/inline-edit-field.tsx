import { useState } from "react"

import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog"

/**
 * InlineEditField — read-only display box (bg-surface) + trailing "Edit" link.
 *
 * Spec (Figma "Signal" 805:12358 — Settings/Account "Current Password" field):
 *   - Display: 36px row with a 1px light border (border-border, white fill — NOT
 *     a bg-surface tint; matches the sibling Input fields on the same screen),
 *     value text left, "Edit" link right
 *   - Edit link: black underline, 14px (text-foreground underline / type-body)
 *   - Click "Edit" → Dialog with a draft Input pre-filled + Cancel/Save footer
 *
 * Props:
 *   label   — field label (type-caption text-muted-foreground)
 *   value   — current value to display
 *   onSave  — called with the new value when confirmed; omit = display-only
 */
export type InlineEditFieldProps = {
  label: string
  value: string
  onSave?: (next: string) => void
}

export function InlineEditField({ label, value, onSave }: InlineEditFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="type-caption text-muted-foreground">{label}</span>

      <div className="border-border bg-background flex h-9 items-center justify-between gap-3 border px-3">
        <span className="type-body">{value}</span>

        {onSave != null && <InlineEditModal label={label} value={value} onSave={onSave} />}
      </div>
    </div>
  )
}

// ── Private modal sub-component (draft state lives here, remounts on Dialog open) ──

function InlineEditModal({
  label,
  value,
  onSave,
}: {
  label: string
  value: string
  onSave: (next: string) => void
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="text-foreground h-auto p-0 underline">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md gap-0 p-0 shadow-none">
        <DialogHeader className="px-5 py-4">
          <DialogTitle className="type-display-3">Edit {label}</DialogTitle>
        </DialogHeader>
        <div className="border-border border-t" />
        {/* Draft state is inside this content — Radix re-mounts on each open */}
        <InlineEditBody label={label} value={value} onSave={onSave} />
      </DialogContent>
    </Dialog>
  )
}

function InlineEditBody({
  label,
  value,
  onSave,
}: {
  label: string
  value: string
  onSave: (next: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const isEmpty = draft.trim() === ""

  return (
    <>
      <div className="px-5 py-4">
        <div className="flex flex-col gap-1">
          <label className="type-caption text-muted-foreground" htmlFor="ief-input">
            {label}
          </label>
          <Input
            id="ief-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
        </div>
      </div>
      <DialogFooter className="flex flex-row justify-end gap-3 px-5 pt-0 pb-5 sm:flex-row">
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="commit" disabled={isEmpty} onClick={() => onSave(draft)}>
            Save
          </Button>
        </DialogClose>
      </DialogFooter>
    </>
  )
}
