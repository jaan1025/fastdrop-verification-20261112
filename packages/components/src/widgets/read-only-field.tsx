/**
 * ReadOnlyField — label above a non-editable value box.
 *
 * Figma (Signal 805:12347, the read-only "Email Address" field on the Profile
 * screen — sibling of the editable "Text Field_Medium" 805:12337):
 *   - label:  Funnel Sans Regular 14px #000, leading 22px → type-body text-foreground
 *   - box:    36px tall, white bg, 1px solid border (Figma #dbdbdb ≈ --border #e5e5e5),
 *             square (radius 0), padding left 12px / top ~7px
 *   - value:  Funnel Sans Regular 14px #000 at opacity-40 (the read-only / dimmed tint)
 *   - gap label→box: 4px
 *
 * Used for fields the user cannot edit directly inline (email, username, plan tier).
 */
export function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="type-body text-foreground">{label}</span>
      <div className="border-border bg-background flex h-9 items-center border px-3 py-2">
        <span className="type-body text-foreground opacity-40">{value}</span>
      </div>
    </div>
  )
}

export type ReadOnlyFieldProps = {
  label: string
  value: string
}
