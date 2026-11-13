import { lazy, Suspense } from "react"

import { claimDisplay, type ClaimRuntimeProps } from "./claim-session"

const Runtime = lazy(() => import("../flow/flow-view").then(({ FlowView }) => ({ default: FlowView })))

export function ClaimRuntime({ children }: ClaimRuntimeProps) {
  return (
    <Suspense fallback={children({ ...claimDisplay(), phase: "checking" })}>
      <Runtime>{children}</Runtime>
    </Suspense>
  )
}
