import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useSetApiKey } from "@repo/auth"
import { Button } from "@repo/ui/components/button"
import { FieldGroup } from "@repo/ui/components/field"
import { TextField } from "@repo/ui/components/fields"

const apiKeySchema = z.object({
  apiKey: z.string().trim().min(8, "Enter your valid API key."),
})

export interface ApiKeyFormProps {
  onSuccess: (token: string) => void
  disabled?: boolean
}

export function ApiKeyForm({ onSuccess, disabled }: ApiKeyFormProps) {
  const setApiKey = useSetApiKey()

  const form = useForm({
    defaultValues: { apiKey: "" },
    validators: { onChange: apiKeySchema, onSubmit: apiKeySchema },
    onSubmit: async ({ value }) => {
      // `.parse()` re-runs the schema's `.trim()` so trailing whitespace from a
      // pasted token doesn't reach `setApiKey` (which feeds JWT validation
      // downstream).
      const { apiKey } = apiKeySchema.parse(value)
      setApiKey(apiKey)
      onSuccess(apiKey)
    },
  })

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field
          name="apiKey"
          children={(field) => (
            <TextField
              field={field}
              label="API Key"
              type="password"
              placeholder="••••••••••••"
              className="font-mono"
            />
          )}
        />
        <form.Subscribe
          // The button is only rendered once the key passes the schema, so we
          // derive validity straight from the values (TanStack's `canSubmit`
          // defaults to true before the first change and would flash the button
          // on an empty field). It stays visible while submitting, just disabled.
          selector={(s) => ({
            isValid: apiKeySchema.safeParse(s.values).success,
            isSubmitting: s.isSubmitting,
          })}
          children={(state) =>
            state.isValid ? (
              <Button
                type="submit"
                // Override the default `opacity-50` disabled state — on a blue
                // primary button it reads as lavender, indistinguishable from an
                // alternate brand tint. Solid muted is unambiguous.
                className="disabled:bg-muted disabled:text-muted-foreground w-full disabled:opacity-100"
                disabled={disabled || state.isSubmitting}
              >
                Sign In
              </Button>
            ) : null
          }
        />
      </FieldGroup>
    </form>
  )
}
