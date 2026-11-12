import { LogOutIcon } from "lucide-react"
import { ChainIcon } from "@repo/components/chain-icon"
import { truncateAddress } from "@repo/shared/utils"
import { Button } from "@repo/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu"

const ADDRESS_PREFIX = 6
const ADDRESS_SUFFIX = 4

export interface ConnectedWalletProps {
  /** ChainId for the chain icon. Undefined renders the icon's fallback. */
  chainId: string | undefined
  /** Connected wallet address — rendered as a 6…4 mono truncation. */
  address: string
  /** Invoked from the dropdown's "Disconnect" item. */
  onDisconnect: () => void
}

/**
 * Connected-wallet pill: a chain icon + truncated address as a dropdown trigger,
 * whose only item disconnects. Presentational — the caller owns connection state
 * and the disconnect side-effect (`onDisconnect`).
 *
 * Renders a short 6…4 truncation instead of the full `<WalletAddress>` widget:
 * the pill is a button trigger, and nesting a copy affordance inside another
 * clickable would block the dropdown gesture.
 */
export function ConnectedWallet({ chainId, address, onDisconnect }: ConnectedWalletProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs">
          <ChainIcon chainId={chainId} size={14} />
          <span className="font-mono">
            {truncateAddress(address, {
              prefix: ADDRESS_PREFIX,
              suffix: ADDRESS_SUFFIX,
            })}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onDisconnect}>
          <LogOutIcon className="mr-2 size-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
