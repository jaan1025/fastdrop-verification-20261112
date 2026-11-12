import { useCallback, useMemo } from "react"

import { getWindow } from "../utils"

// React hook that extracts the URL pathname from an arbitrary URL/path string,
// SSR-safe (falls back to a localhost origin when no `window`).
export const useResolvePathname = (input?: string) => {
  const resolvePathname = useCallback((input?: string) => {
    if (!input) return ""
    try {
      const origin = getWindow()?.location.origin ?? "http://localhost"
      const url = new URL(input, origin)
      return url.pathname
    } catch {
      return ""
    }
  }, [])

  const resolvedPathname = useMemo(() => {
    return resolvePathname(input)
  }, [resolvePathname, input])

  return {
    resolvePathname,
    resolvedPathname,
  }
}
