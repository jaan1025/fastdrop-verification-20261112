import { useNow } from "./use-now"

export interface UseTimeReachedOptions {
  /** Value to return when targetTime is falsy (undefined, null, 0, NaN). */
  fallback?: boolean
}

// React hook that reports whether a target epoch-ms timestamp has been reached.
// Thin derivation over `useNow` (no own interval; the tick naturally stops
// mattering once reached).
export const useTimeReached = (
  targetTime: number | null | undefined,
  options?: UseTimeReachedOptions,
): boolean => {
  const fallback = options?.fallback ?? false
  const now = useNow()

  if (!targetTime || Number.isNaN(targetTime)) return fallback
  return now >= targetTime
}
