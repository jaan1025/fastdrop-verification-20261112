import { useMemo } from "react"

import { useNow } from "./use-now"

export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  /** Raw `targetTime - now` in ms (clamped at 0). */
  diff: number
}

const ZERO: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0, diff: 0 }

// React countdown hook: returns days/hours/minutes/seconds remaining until a
// target epoch-ms timestamp. Thin derivation over `useNow` (no own interval).
export const useTimeLeft = (targetTime: number | undefined): TimeLeft => {
  const now = useNow()

  return useMemo(() => {
    if (!targetTime) return ZERO

    const diff = targetTime - now
    if (diff <= 0) return ZERO

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds, diff }
  }, [targetTime, now])
}
