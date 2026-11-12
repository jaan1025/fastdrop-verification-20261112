import { usePersistFn } from "@repo/shared/hooks"
import { useAccount, useSwitchChain } from "wagmi"

export const useEnsureChainSwitched = (options?: { chainId: number }) => {
  const { chainId: currentChainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()

  const ensureChainSwitched = usePersistFn(async (chainId?: number) => {
    const targetChainId = chainId || options?.chainId
    if (!targetChainId) {
      throw new Error("Target chain ID is not set")
    }
    if (currentChainId !== targetChainId) {
      await switchChainAsync({ chainId: targetChainId })
    }
  })

  return {
    ensureChainSwitched,
  }
}
