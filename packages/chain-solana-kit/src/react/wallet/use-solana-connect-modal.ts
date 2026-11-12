import { useSolana } from "../components/solana-provider"

/**
 * Connect-modal open/close controls under chain-namespaced names + the open
 * state, so the app's both-chain login root can bind its dialog to the Solana
 * arm (the JSX dialog itself re-homes to `@repo/airdrop-app-shared`).
 */
export const useSolanaConnectModal = () => {
  const { openConnectModal, closeConnectModal, isConnectModalOpen } = useSolana()

  return {
    openSolanaConnectModal: openConnectModal,
    closeSolanaConnectModal: closeConnectModal,
    isSolanaConnectModalOpen: isConnectModalOpen,
  }
}
