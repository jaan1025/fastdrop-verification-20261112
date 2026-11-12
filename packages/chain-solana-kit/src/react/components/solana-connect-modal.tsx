import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/components/dialog"
import { X, Loader2Icon, LogOut } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { usePersistFn } from "@repo/shared/hooks"
import { type UiWallet, type UiWalletAccount, useConnect } from "@wallet-standard/react"
import { useDisconnect } from "../wallet/use-disconnect"
import { useSolana } from "./solana-provider"

interface SolanaConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const SolanaConnectModal = ({ open, onOpenChange }: SolanaConnectModalProps) => {
  const { wallets, selectedWallet, selectedAccount, setWalletAndAccount, isConnected } = useSolana()
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const handleConnectStart = usePersistFn((wallet: UiWallet) => {
    setSelectedName(wallet.name)
    setConnectionError(null)
  })

  const handleConnectSuccess = usePersistFn((wallet: UiWallet, account: UiWalletAccount) => {
    setWalletAndAccount(wallet, account)
    setSelectedName(null)
    onOpenChange(false)
  })

  const handleConnectError = usePersistFn((error: unknown) => {
    setConnectionError(error instanceof Error ? error.message : String(error))
    setSelectedName(null)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="bg-popover data-[state=open]:slide-in-from-bottom w-full max-w-[360px] gap-0 rounded-xl border p-0 shadow-xl sm:max-w-[360px]"
      >
        <div className="relative px-6 py-4">
          <DialogTitle className="text-center text-lg font-semibold">Connect Wallet</DialogTitle>
          <div
            className="absolute top-3 right-3 flex size-8 cursor-pointer items-center justify-center rounded-full hover:opacity-90"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </div>
        </div>

        <div className="max-h-[468px] overflow-auto px-6 py-4">
          {connectionError ? (
            <div className="bg-destructive/10 text-destructive mb-4 rounded-lg p-3 text-sm">
              <strong>Connection Failed:</strong> {connectionError}
            </div>
          ) : null}

          {isConnected && selectedWallet && selectedAccount ? (
            <ConnectedWalletSection wallet={selectedWallet} account={selectedAccount} />
          ) : null}

          <div className="text-muted-foreground mb-3 text-sm font-medium">Available</div>
          <div className="space-y-2">
            {wallets.map((wallet) => (
              <WalletItem
                key={wallet.name}
                wallet={wallet}
                onConnectStart={handleConnectStart}
                onConnected={handleConnectSuccess}
                onError={handleConnectError}
                isSelected={selectedName === wallet.name}
              />
            ))}
          </div>

          {wallets.length === 0 ? (
            <div className="text-muted-foreground text-center text-sm">
              No wallets detected. Install a Solana-compatible wallet to continue.
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

const WalletItem = (props: {
  wallet: UiWallet
  onConnectStart: (wallet: UiWallet) => void
  onConnected: (wallet: UiWallet, account: UiWalletAccount) => void
  onError: (error: unknown) => void
  isSelected: boolean
}) => {
  const { wallet, onConnectStart, onConnected, onError, isSelected } = props
  const [isConnecting, connect] = useConnect(wallet)

  const handleClick = async () => {
    if (isConnecting) return
    try {
      onConnectStart(wallet)
      const accounts = await connect()
      const firstAccount = accounts?.[0]
      if (!firstAccount) {
        throw new Error("Wallet returned no accounts")
      }
      onConnected(wallet, firstAccount)
    } catch (error) {
      onError(error)
    }
  }

  return (
    <div
      className={cn(
        "item-center flex cursor-pointer justify-between gap-3 rounded-md p-[5px] hover:bg-[rgba(60,66,66,0.1)]",
        (isConnecting || isSelected) && "opacity-70",
      )}
      onClick={handleClick}
    >
      {wallet.icon ? (
        <img src={wallet.icon} alt={wallet.name} className="size-[28px] rounded-md" />
      ) : (
        <div className="bg-secondary flex size-[28px] items-center justify-center rounded-md text-xs font-semibold">
          {wallet.name.slice(0, 2).toUpperCase()}
        </div>
      )}

      <div className="flex-1 font-semibold">{wallet.name}</div>
      {isConnecting || isSelected ? <Loader2Icon className="size-4 animate-spin" /> : null}
    </div>
  )
}

const ConnectedWalletSection = (props: { wallet: UiWallet; account: UiWalletAccount }) => {
  const { wallet, account } = props
  const [isDisconnecting, disconnect] = useDisconnect(wallet)

  return (
    <div className="mb-4 rounded-lg border px-3 py-2">
      <div className="flex items-center gap-2">
        {wallet.icon ? (
          <img src={wallet.icon} alt={wallet.name} className="size-[24px] rounded-md" />
        ) : null}
        <div className="flex flex-col">
          <span className="text-sm font-medium">{wallet.name}</span>
          <span className="text-muted-foreground font-mono text-xs">{account.address}</span>
        </div>
      </div>
      <button
        className="bg-destructive text-destructive-foreground mt-3 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm hover:opacity-90 disabled:opacity-60"
        onClick={disconnect}
        disabled={isDisconnecting}
      >
        <LogOut className="size-4" />
        Disconnect
      </button>
    </div>
  )
}
