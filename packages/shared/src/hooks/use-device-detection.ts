import isMobile from "is-mobile"
import { useLayoutEffect, useState } from "react"

import { getWindow } from "../utils"

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLoading: boolean
}

// Hook that classifies the current device as mobile / tablet / desktop via the
// `is-mobile` UA library, re-detecting on resize. SSR-safe.
//
// Note: this (UA-based) is intentionally distinct from `useIsMobileLayout`
// (viewport-width); pick deliberately.
export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLoading: true,
  })

  useLayoutEffect(() => {
    const win = getWindow()
    if (!win) return

    const detectDevice = () => {
      const mobileDetected = isMobile()
      const tabletDetected = isMobile({ tablet: true }) && !mobileDetected
      const desktopDetected = !mobileDetected && !tabletDetected

      setDeviceInfo({
        isMobile: mobileDetected,
        isTablet: tabletDetected,
        isDesktop: desktopDetected,
        isLoading: false,
      })
    }

    detectDevice()

    const handleResize = () => {
      detectDevice()
    }

    win.addEventListener("resize", handleResize)
    return () => {
      win.removeEventListener("resize", handleResize)
    }
  }, [])

  return deviceInfo
}
