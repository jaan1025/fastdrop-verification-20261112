import { useEffect, useState } from "react"

// The single 1-second-tick clock core shared by both timer hooks. One
// `setInterval` against wall-clock; `useTimeLeft` and `useTimeReached` are thin
// derivations.
export const useNow = (intervalMs = 1000): number => {
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => {
      setNow(Date.now())
    }, intervalMs)
    return () => {
      clearInterval(id)
    }
  }, [intervalMs])

  return now
}
