import { useEffect, useRef } from "react"
import { useAccount } from "wagmi"

export const useWatchDisconnect = (callback: () => void) => {
  const { address } = useAccount()
  const wasConnectedRef = useRef(Boolean(address))

  useEffect(() => {
    if (wasConnectedRef.current && !address) {
      callback()
    }
    wasConnectedRef.current = Boolean(address)
  }, [address, callback])
}
