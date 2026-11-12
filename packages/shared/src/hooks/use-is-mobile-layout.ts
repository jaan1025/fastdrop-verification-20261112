import { useEffect, useState } from "react"

import { getWindow } from "../utils"

const MOBILE_BREAKPOINT = 640

// Viewport-width hook returning whether the layout is below the mobile
// breakpoint (640px), tracking window resize. SSR-safe.
//
// Note: this (viewport-width) is intentionally distinct from
// `useDeviceDetection` (UA-based); pick deliberately.
export const useIsMobileLayout = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    const win = getWindow()
    return win ? win.innerWidth < MOBILE_BREAKPOINT : false
  })

  useEffect(() => {
    const win = getWindow()
    if (!win) return

    const handleResize = () => {
      setIsMobile(win.innerWidth < MOBILE_BREAKPOINT)
    }

    win.addEventListener("resize", handleResize)
    return () => {
      win.removeEventListener("resize", handleResize)
    }
  }, [])

  return isMobile
}
