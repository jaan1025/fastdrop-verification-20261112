import { isAddress, isAddressEqual, zeroAddress } from "viem"
import { type ChainKind, type ConfigurationRecord } from "@repo/acs-client/model"
import { pieceDurationToInterval } from "./piece-duration"
import type { NormalizedPreset } from "../distributor/preset"
import type { Schedule } from "./types"

/**
 * PURE mapper: a deployed on-chain `NormalizedPreset` (+ the off-chain
 * `ConfigurationRecord` for code/name/description) → the kernel `Schedule` the
 * `@repo/components` schedule widgets render. The kernel `deriveSchedule` takes a
 * FORM `ScheduleInput`, so this on-chain-preset → `Schedule` projection is the
 * complementary read-path seam. The ONE canonical copy, shared by the portal's
 * `useBatchSchedule` and the console's `useSchedule` (deduped from the portal-
 * local original — analysis: unify schedule panel). No fetch.
 *
 * When the preset is NOT deployed (EVM lock is zero/invalid, or no preset at
 * all) we return an empty/zero schedule rather than the off-chain `ConfigurationRecord`
 * "draft", matching legacy (which reads on-chain only — the off-chain record may
 * carry stale form defaults).
 */
export function presetToSchedule(input: {
  code: string
  config: ConfigurationRecord
  chainKind: ChainKind
  onChainPreset: NormalizedPreset | null
}): Schedule {
  const { code, config, chainKind, onChainPreset } = input
  const lock = onChainPreset?.lock ?? null
  const isDeployed = isPresetDeployed(lock, chainKind)

  if (isDeployed && onChainPreset) {
    const decoded = pieceDurationToInterval(onChainPreset.pieceDuration)
    // A non-decodable on-chain pieceDuration falls back to continuous (display
    // only — the protocol math reads the raw `pieceDuration` field, kept below).
    const interval = decoded.ok ? decoded.interval : "continuous"
    return {
      code,
      displayName: config.displayName ?? code,
      description: config.description,
      interval,
      cliffSeconds: onChainPreset.cliffSeconds,
      vestingSeconds: onChainPreset.vestingSeconds,
      startUnlockPercent: onChainPreset.startUnlockPercent,
      cliffUnlockPercent: onChainPreset.cliffUnlockPercent,
      isFixedStart: onChainPreset.isFixedStart,
      startTimeUnix: onChainPreset.isFixedStart ? onChainPreset.startTimeUnix : null,
      pieceDuration: onChainPreset.pieceDuration,
    }
  }

  return {
    code,
    displayName: config.displayName ?? code,
    description: config.description,
    interval: "continuous",
    cliffSeconds: 0n,
    vestingSeconds: 0n,
    startUnlockPercent: 0,
    cliffUnlockPercent: 0,
    isFixedStart: false,
    startTimeUnix: null,
    pieceDuration: 0n,
  }
}

/**
 * The deployed on-chain lock/program address for a preset, or `null` when the
 * preset isn't deployed (EVM zero/invalid address, or no preset). The lock is a
 * deployment artifact — NOT part of the kernel `Schedule` template — so the
 * schedule widgets take it as a separate prop. Both the portal's
 * `useBatchSchedule` and the console's `useSchedule` source the panel's
 * `lockContract` from here.
 */
export function presetLockAddress(
  onChainPreset: NormalizedPreset | null | undefined,
  chainKind: ChainKind,
): string | null {
  const lock = onChainPreset?.lock ?? null
  return isPresetDeployed(lock, chainKind) ? lock : null
}

export function isPresetDeployed(lock: string | null, chainKind: ChainKind): boolean {
  if (!lock) return false
  if (chainKind === "evm") {
    // `isAddressEqual` calls `getAddress` internally and throws on invalid
    // input — guard malformed strings; treat them as "not deployed".
    if (!isAddress(lock)) return false
    return !isAddressEqual(lock, zeroAddress)
  }
  return true
}
