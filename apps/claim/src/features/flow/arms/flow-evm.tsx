import { EvmProvider, ensureAppKit } from "@repo/airdrop-app-shared/providers/chains/evm"
import { EvmToSSigner } from "@repo/chain-evm-kit/tos-signer"
import { ToSDialog } from "@repo/components/tos-dialog"
import { config } from "@repo/config"

import { Global } from "../providers/global"
import { LiveClaimSession } from "~/features/claim/live-claim-session"
import type { ClaimRuntimeProps } from "~/features/claim/claim-session"
import { ClaimArmProvider, type ClaimArm } from "./claim-arm-context"
import { useWalletConnectionEvm } from "./evm/use-wallet-connection-evm"
import { useClaimConsumptionEvm } from "./evm/use-claim-consumption-evm"
import { useClaimTokenDecimalsEvm } from "./evm/use-claim-token-decimals-evm"
import { useClaimEvm } from "./evm/use-claim-evm"
import { useClaimLockEvm } from "./evm/use-claim-lock-evm"

// AppKit (the EVM wallet modal) MUST be initialized at module scope — a side
// effect at import time, never during render (see providers/chains/init.ts).
// Moving it INTO this arm module is the point of the split: a Solana-only bundle
// never imports flow-evm, so `createAppKit` never runs there. This module is
// reached only via the `ssr: false` /flow route's lazy `import('./arms/flow-evm')`,
// so it never runs on the server (ensureAppKit is a no-op there anyway); the
// idempotent guard keeps a re-import (StrictMode double-invoke / a fresh lazy
// load) a single init.
ensureAppKit({
  name: config.name || "Airdrop Claim",
  description: config.meta.description || "Claim your airdrop",
})

// The EVM arm's capabilities, handed to the shared steps via ClaimArmProvider.
// Each is a hook the steps call at their own call site (Rules of Hooks).
const evmArm: ClaimArm = {
  useConnection: useWalletConnectionEvm,
  useConsumption: useClaimConsumptionEvm,
  useDecimals: useClaimTokenDecimalsEvm,
  useClaim: useClaimEvm,
  useLock: useClaimLockEvm,
}

const FlowEvm = ({ children }: ClaimRuntimeProps) => (
  <EvmProvider tosHost={<EvmToSSigner Dialog={ToSDialog} />}>
    <Global>
      <ClaimArmProvider arm={evmArm}>
        <LiveClaimSession>{children}</LiveClaimSession>
      </ClaimArmProvider>
    </Global>
  </EvmProvider>
)

export default FlowEvm
