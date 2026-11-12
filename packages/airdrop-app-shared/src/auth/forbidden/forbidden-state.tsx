import { useNavigate } from "@tanstack/react-router"
import { ShieldX } from "lucide-react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty"
import { Button } from "@repo/ui/components/button"

import { useLogout } from "../hooks/use-logout"

export type ForbiddenStateProps = {
  title?: string
  description?: string
}

// Shared terminal 403 page state. Composes the DS `Empty` family (muted icon
// treatment, DS heading weight via EmptyTitle) and OWNS the single sign-out
// recovery CTA. Navigation after logout is a UX side-effect, so it lives here in
// the component handler — not in `useLogout` (see features/README.md).
export function ForbiddenState({ title = "Access denied", description }: ForbiddenStateProps) {
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <Empty className="max-w-sm">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldX />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          {description ? <EmptyDescription>{description}</EmptyDescription> : null}
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => void logout().then(() => navigate({ to: "/login", replace: true }))}
          >
            Sign out and return to login
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
