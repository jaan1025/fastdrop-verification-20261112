"use client"

// TanStack Form-coupled field wrappers.
//
// shadcn deliberately removed `<FormField>` from its current Form recipe
// because the wrapper encoded react-hook-form specifics. This file accepts
// that tradeoff and adds back a thin set of wrappers — but bound to TanStack
// Form (the project's mandated form library, see CLAUDE.md). Use these inside
// `<form.Field>` render-props to collapse the ~25-line per-field boilerplate
// (Field + FieldLabel + Input/Select/Switch + FieldError + isInvalid
// derivation) down to one element.
//
// For controls that don't have a typed wrapper here (Slider, InputOTP,
// Combobox, custom inputs), use <FormField> as the shell and place the
// control inside the render-prop.

import type { ComponentProps, ReactNode } from "react"

import { Input } from "@repo/ui/components/input"
import { Switch } from "@repo/ui/components/switch"
import { Textarea } from "@repo/ui/components/textarea"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@repo/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"

type FieldErrors = Array<{ message?: string } | undefined>

type FieldMeta = {
  isTouched: boolean
  isValid: boolean
  errors: FieldErrors
}

/**
 * Read-only slice of a field — what FormField and deriveInvalid actually
 * need. Defined separately from FieldShape<T> because FieldShape<T> is
 * invariant in T (handleChange is contravariant), so FieldShape<string>
 * isn't assignable to FieldShape<unknown> even though it should be for
 * read-only use. This shape is covariant — any FieldShape<T> structurally
 * extends it.
 */
type FieldReadable = {
  name: string
  state: { meta: FieldMeta }
}

/**
 * Minimal structural shape of a TanStack Form `field` API.
 *
 * Wrappers below accept any object that matches this shape — usually the
 * `field` parameter from `<form.Field>` render-prop. Structural typing keeps
 * the wrapper API free of TanStack Form's heavy generic chain while still
 * type-checking value/handleChange against the field's actual data type.
 */
export type FieldShape<T> = {
  name: string
  state: {
    value: T
    meta: FieldMeta
  }
  handleChange: (value: T) => void
  handleBlur: () => void
}

type CommonProps = {
  label?: string
  description?: string
  /**
   * Force the invalid state to render even if the field hasn't been blurred
   * yet. Wire this from wizard "Continue" / "Submit" attempts so step-level
   * errors show before the user has touched each field individually.
   *
   * Has no effect when the field is actually valid — only changes whether
   * existing errors render.
   */
  forceInvalid?: boolean
}

function deriveInvalid(field: FieldReadable, forceInvalid?: boolean): boolean {
  return (field.state.meta.isTouched || forceInvalid === true) && !field.state.meta.isValid
}

// ---------------------------------------------------------------------------
// FormField — generic shell for custom controls
// ---------------------------------------------------------------------------

type FormFieldProps = CommonProps & {
  field: FieldReadable
  children: (helpers: { id: string; isInvalid: boolean }) => ReactNode
}

/**
 * Generic field shell. Use for controls without a typed wrapper here
 * (Slider, InputOTP, Combobox, Calendar, custom inputs). Composes
 * Field + FieldLabel + FieldDescription + FieldError around your render-prop
 * content. Children receive `id` (for htmlFor) and `isInvalid` (for
 * aria-invalid).
 */
function FormField({ field, label, description, forceInvalid, children }: FormFieldProps) {
  const isInvalid = deriveInvalid(field, forceInvalid)
  return (
    <Field data-invalid={isInvalid}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      {children({ id: field.name, isInvalid })}
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

// ---------------------------------------------------------------------------
// TextField — string input
// ---------------------------------------------------------------------------

type TextFieldProps = CommonProps &
  Omit<ComponentProps<typeof Input>, "id" | "value" | "onChange" | "onBlur" | "aria-invalid"> & {
    field: FieldShape<string>
  }

function TextField({ field, label, description, forceInvalid, ...inputProps }: TextFieldProps) {
  return (
    <FormField field={field} label={label} description={description} forceInvalid={forceInvalid}>
      {({ id, isInvalid }) => (
        <Input
          id={id}
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          aria-invalid={isInvalid}
          {...inputProps}
        />
      )}
    </FormField>
  )
}

// ---------------------------------------------------------------------------
// NumberField — number input. An empty input becomes NaN (not 0), so the
// validation schema rejects it. Coercing empty -> 0 instead would silently turn
// a cleared field into a valid 0 that submits — hiding the "required field was
// cleared" error for any field where 0 is itself a valid value (e.g. a cliff
// period or a percentage). NaN keeps "empty" distinct from a deliberate 0.
// Caveat: NaN is still typeof "number", so it leaks past the type system —
// consumers that read the raw value before validation (live previews) must
// guard against NaN (e.g. Number.isFinite(x) ? x : 0).
// ---------------------------------------------------------------------------

type NumberFieldProps = CommonProps &
  Omit<
    ComponentProps<typeof Input>,
    "id" | "value" | "onChange" | "onBlur" | "aria-invalid" | "type"
  > & {
    field: FieldShape<number>
  }

function NumberField({ field, label, description, forceInvalid, ...inputProps }: NumberFieldProps) {
  return (
    <FormField field={field} label={label} description={description} forceInvalid={forceInvalid}>
      {({ id, isInvalid }) => (
        <Input
          id={id}
          type="number"
          value={Number.isFinite(field.state.value) ? field.state.value : ""}
          onChange={(e) =>
            field.handleChange(e.target.value === "" ? Number.NaN : e.target.valueAsNumber)
          }
          onBlur={field.handleBlur}
          aria-invalid={isInvalid}
          {...inputProps}
        />
      )}
    </FormField>
  )
}

// ---------------------------------------------------------------------------
// SelectField — single-select with `options` array
// ---------------------------------------------------------------------------

export type SelectFieldOption<TValue extends string = string> = {
  value: TValue
  label?: ReactNode
  disabled?: boolean
}

// Internal sentinel: Radix `Select` forbids `""` as a value, so an optional
// field can't represent "nothing selected" with the empty string. We map
// `undefined ↔ NONE_SENTINEL` inside the component so the field type stays
// `string | undefined` (zod-friendly: `z.string().optional()`).
const NONE_SENTINEL = "__none__"

type AllowNone = { label: ReactNode; placeholder?: string } | undefined

// `field` type narrows on the presence of `allowNone`: with it, the field
// holds `string | undefined`; without it, plain `string`. Keeps callers from
// having to widen the schema just to use this component.
type SelectFieldProps<TValue extends string, TAllowNone extends AllowNone> = CommonProps & {
  field: TAllowNone extends undefined ? FieldShape<TValue> : FieldShape<TValue | undefined>
  options: ReadonlyArray<SelectFieldOption<TValue>>
  placeholder?: string
  triggerClassName?: string
  /**
   * Apply `capitalize` to each option label — convenient when option values
   * are lowercase enums (e.g. "ethereum" → "Ethereum").
   */
  capitalize?: boolean
  /**
   * Render an explicit "none" option above the real ones. `field.state.value`
   * is `undefined` when this is selected; selecting it again sets it back
   * to `undefined`. Pair with `z.string().optional()`.
   */
  allowNone?: TAllowNone
}

// Generic so a field typed `FieldShape<"admin" | "operator">` (z.enum output)
// keeps its literal union all the way through — both `field.handleChange`
// and `options[].value` narrow to the same union.
function SelectField<TValue extends string, TAllowNone extends AllowNone = undefined>({
  field,
  label,
  description,
  forceInvalid,
  options,
  placeholder,
  triggerClassName,
  capitalize,
  allowNone,
}: SelectFieldProps<TValue, TAllowNone>) {
  const hasNone = allowNone !== undefined
  const selectValue = field.state.value ?? (hasNone ? NONE_SENTINEL : "")
  const handleSelectChange = (raw: string) => {
    if (hasNone && raw === NONE_SENTINEL) {
      ;(field.handleChange as (v: TValue | undefined) => void)(undefined)
      return
    }
    field.handleChange(raw as TValue)
  }
  return (
    <FormField field={field} label={label} description={description} forceInvalid={forceInvalid}>
      {({ id, isInvalid }) => (
        <Select value={selectValue} onValueChange={handleSelectChange}>
          <SelectTrigger id={id} aria-invalid={isInvalid} className={triggerClassName}>
            <SelectValue placeholder={hasNone ? allowNone.placeholder : placeholder} />
          </SelectTrigger>
          <SelectContent>
            {hasNone && <SelectItem value={NONE_SENTINEL}>{allowNone.label}</SelectItem>}
            {options.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={capitalize ? "capitalize" : undefined}
              >
                {opt.label ?? opt.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  )
}

// ---------------------------------------------------------------------------
// SwitchField — boolean toggle, horizontal Field layout. Has its own shell
// because the layout doesn't match FormField (Switch sits to the right of
// label/description, not below).
// ---------------------------------------------------------------------------

type SwitchFieldProps = CommonProps & {
  field: FieldShape<boolean>
  /** Switch fields render label + description on the left of the toggle. */
  label: string
  /** Outer wrapper class — pass `border p-3` for a bordered toggle row. */
  className?: string
}

function SwitchField({ field, label, description, forceInvalid, className }: SwitchFieldProps) {
  const isInvalid = deriveInvalid(field, forceInvalid)
  return (
    <Field orientation="horizontal" data-invalid={isInvalid} className={className}>
      <FieldContent>
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <Switch
        id={field.name}
        checked={field.state.value}
        onCheckedChange={field.handleChange}
        aria-invalid={isInvalid}
      />
    </Field>
  )
}

// ---------------------------------------------------------------------------
// TextareaField — multi-line string input
// ---------------------------------------------------------------------------

type TextareaFieldProps = CommonProps &
  Omit<ComponentProps<typeof Textarea>, "id" | "value" | "onChange" | "onBlur" | "aria-invalid"> & {
    field: FieldShape<string>
  }

function TextareaField({
  field,
  label,
  description,
  forceInvalid,
  ...textareaProps
}: TextareaFieldProps) {
  return (
    <FormField field={field} label={label} description={description} forceInvalid={forceInvalid}>
      {({ id, isInvalid }) => (
        <Textarea
          id={id}
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          aria-invalid={isInvalid}
          {...textareaProps}
        />
      )}
    </FormField>
  )
}

export { FormField, TextField, NumberField, SelectField, SwitchField, TextareaField }
