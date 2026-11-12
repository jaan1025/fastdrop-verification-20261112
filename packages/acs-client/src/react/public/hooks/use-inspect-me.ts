"use client"
import type { InspectQueryKey } from "../../../query/public/inspect"
import type { InspectResult } from "../../../model"
import type { QueryParameter } from "../../types/query-parameter"
import { useInspect } from "./use-inspect"

const extractIss = (token: string): string | undefined => {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return undefined
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))
    return typeof payload.iss === "string" && payload.iss.length > 0 ? payload.iss : undefined
  } catch {
    return undefined
  }
}

// Convenience over `useInspect` — extract the `iss` claim from a JWT and
// inspect the subject. Pass the user's session JWT from the caller's auth
// state.
export const useInspectMe = <TData = InspectResult>(
  token: string | null | undefined,
  parameters: QueryParameter<InspectResult, Error, TData, InspectQueryKey> = {},
) => {
  const handler = token ? extractIss(token) : undefined
  return useInspect({ handler, ...parameters })
}
