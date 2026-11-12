import { createFileRoute } from "@tanstack/react-router"

import { ClaimPortal } from "~/features/claim-ui/claim-portal"

export const Route = createFileRoute("/flow")({ ssr: false, component: ClaimPortal })
