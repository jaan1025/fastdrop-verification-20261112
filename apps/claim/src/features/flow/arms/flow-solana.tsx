import { SolanaRootProvider } from "@repo/airdrop-app-shared/providers/chains/solana"
import { SolanaToSSigner } from "@repo/chain-solana-kit/tos-signer"
import { ToSDialog } from "@repo/components/tos-dialog"

import { Global } from "../providers/global"
import { LiveClaimSession } from "~/features/claim/live-claim-session"
import type { ClaimRuntimeProps } from "~/features/claim/claim-session"
import { ClaimArmProvider, type ClaimArm } from "./claim-arm-context"
import { useWalletConnectionSolana } from "./solana/use-wallet-connection-solana"
import { useClaimConsumptionSolana } from "./solana/use-claim-consumption-solana"
import { useClaimTokenDecimalsSolana } from "./solana/use-claim-token-decimals-solana"
import { useClaimSolana } from "./solana/use-claim-solana"
import { useClaimLockSolana } from "./solana/use-claim-lock-solana"

// The Solana arm's capabilities, handed to the shared steps via ClaimArmProvider.
// Each is a hook the steps call at their own call site (Rules of Hooks). No AppKit
// init here — that is EVM-only and lives in flow-evm.tsx, so a Solana-only bundle
// never boots it.
const solanaArm: ClaimArm = {
  useConnection: useWalletConnectionSolana,
  useConsumption: useClaimConsumptionSolana,
  useDecimals: useClaimTokenDecimalsSolana,
  useClaim: useClaimSolana,
  useLock: useClaimLockSolana,
}

const FlowSolana = ({ children }: ClaimRuntimeProps) => (
  <SolanaRootProvider tosHost={<SolanaToSSigner dialog={(props) => <ToSDialog {...props} />} />}>
    <Global>
      <ClaimArmProvider arm={solanaArm}>
        <LiveClaimSession>{children}</LiveClaimSession>
      </ClaimArmProvider>
    </Global>
  </SolanaRootProvider>
)

export default FlowSolana
