import { useEffect, useRef } from "react"
import { useSolana } from "../components/solana-provider"

/**
 * Watches for wallet disconnection and fires the callback
 * when transitioning from connected → disconnected.
 */
export const useWatchDisconnect = (onDisconnect: () => void) => {
  const { isConnected } = useSolana()
  const wasConnectedRef = useRef(false)

  useEffect(() => {
    if (!isConnected && wasConnectedRef.current) {
      onDisconnect()
    }
    wasConnectedRef.current = isConnected
  }, [isConnected, onDisconnect])
}
