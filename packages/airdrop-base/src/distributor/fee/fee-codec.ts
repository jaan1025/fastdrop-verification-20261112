import { resolveChainKind } from "@repo/acs-client/model"
import { match } from "@repo/shared/utils"
import type { FeeMode } from "@repo/acs-client/model"
import type { BatchFeeConfig } from "./fee-config"
import { encodeFeeModeEvm, formatAmountEvm, formatRateEvm } from "./fee-codec-evm"
import { encodeFeeModeSolana, formatAmountSolana, formatRateSolana } from "./fee-codec-solana"

/**
 * Per-batch fee codec facade — the chain-free entry the editor + display call.
 * Dispatches on the batch's `chainId` (via `resolveChainKind`) to the
 * `-evm` / `-solana` leaf, each of which owns its chain's scale and stack
 * (viem stays inside `fee-codec-evm`; the Solana leaf imports neither).
 *
 * The chain split exists purely to keep EVM (`viem.parseEther`/WAD) and Solana
 * (lamports/1e9) maths apart at the file level — there are no React hooks here,
 * so this is the pure-function-with-internal-dispatch boundary, expressed with
 * the same `-evm`/`-solana` leaf shape the chain-dispatch pattern mandates.
 *
 * An unrecognised chain id throws (via `match`) — callers only ever pass an
 * active batch's chain id, so an unresolved id is a programming error.
 */

/**
 * Encode a display `FeeMode` (decimal native amounts; rate as a decimal
 * proportion like `"0.05"`) into raw integer-string wire units for the chain.
 * Integer strings pass through unharmed; the acs relay truncates to integers,
 * so this side must produce raw integers.
 */
export function encodeFeeMode(display: FeeMode, chainId: string): FeeMode {
  const kind = resolveChainKind(chainId)
  if (kind === undefined) {
    throw new Error(`encodeFeeMode: unrecognised chainId "${chainId}"`)
  }
  return match(kind, {
    evm: () => encodeFeeModeEvm(display),
    solana: () => encodeFeeModeSolana(display),
  })
}

/**
 * Render a decoded `BatchFeeConfig` (raw on-chain units) as a human string:
 *   - fixed       → `0.05 SOL`
 *   - single-tier → `5% · min 0.01 SOL · max 1 SOL`, dropping a `min`/`max`
 *                   segment whose raw value is `0n` (so a both-zero bound
 *                   single-tier reads as `5%` alone).
 */
export function formatBatchFeeConfig(
  config: BatchFeeConfig,
  chainId: string,
  nativeSymbol: string,
): string {
  const kind = resolveChainKind(chainId)
  if (kind === undefined) {
    throw new Error(`formatBatchFeeConfig: unrecognised chainId "${chainId}"`)
  }
  const { formatAmount, formatRate } = match(kind, {
    evm: () => ({ formatAmount: formatAmountEvm, formatRate: formatRateEvm }),
    solana: () => ({
      formatAmount: formatAmountSolana,
      formatRate: formatRateSolana,
    }),
  })

  if (config.kind === "fixed") {
    return `${formatAmount(config.amount)} ${nativeSymbol}`
  }

  const segments = [`${formatRate(config.rate)}%`]
  if (config.minFee !== 0n) {
    segments.push(`min ${formatAmount(config.minFee)} ${nativeSymbol}`)
  }
  if (config.maxFee !== 0n) {
    segments.push(`max ${formatAmount(config.maxFee)} ${nativeSymbol}`)
  }
  return segments.join(" · ")
}
