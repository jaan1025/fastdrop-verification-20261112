import { useState, useCallback, useRef } from "react"
import { type UiWallet } from "@wallet-standard/react"
import { getWalletFeature } from "@wallet-standard/ui"
import { StandardDisconnect, type StandardDisconnectFeature } from "@wallet-standard/features"
import { useSolana } from "../components/solana-provider"
import { logger } from "../../utils/logger"

/**
 * A wrapper around wallet-standard disconnect that handles null wallet gracefully
 * and automatically clears provider state + localStorage on disconnect.
 */
export const useDisconnect = (wallet: UiWallet | null): [boolean, () => Promise<void>] => {
  const { setWalletAndAccount } = useSolana()
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const activePromiseRef = useRef<Promise<void> | null>(null)

  const disconnect = useCallback(async () => {
    if (!wallet) {
      return
    }

    if (activePromiseRef.current) {
      return activePromiseRef.current
    }

    try {
      const disconnectFeature = getWalletFeature(
        wallet,
        StandardDisconnect,
      ) as StandardDisconnectFeature[typeof StandardDisconnect]
      const promise = disconnectFeature.disconnect()
      activePromiseRef.current = promise
      setIsDisconnecting(true)
      await promise
    } catch (error) {
      logger.error("Failed to disconnect Solana wallet", error)
    } finally {
      activePromiseRef.current = null
      setIsDisconnecting(false)
      setWalletAndAccount(null, null)
    }
  }, [wallet, setWalletAndAccount])

  return [isDisconnecting, disconnect]
}
