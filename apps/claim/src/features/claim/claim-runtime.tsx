import { lazy, Suspense } from "react"

import { fastdropLive } from "~/lib/fastdrop-mode"
import { claimDisplay, type ClaimRuntimeProps } from "./claim-session"

const Runtime = lazy(() => import("virtual:fastdrop-claim-runtime"))

export function ClaimRuntime({ children }: ClaimRuntimeProps) {
  return (
    <Suspense fallback={children({ ...claimDisplay(fastdropLive ? "live" : "demo"), phase: "checking" })}>
      <Runtime>{children}</Runtime>
    </Suspense>
  )
}
