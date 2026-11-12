import type { ConfigurationRecord } from "./types/app-conf"

/**
 * The fixed vesting start (the raw stored ISO string) a configuration declares,
 * or `undefined` when it starts on claim. Returns the first `lockHook` strategy
 * that uses a fixed start with a non-empty `startTime`.
 *
 * Used by the allocations / streams list to show the real start date for a
 * fixed-start schedule instead of "On claim" — reading the live stored config
 * (the same value the on-chain preset was derived from) rather than an extra
 * on-chain preset read.
 */
export function configFixedStart(config: ConfigurationRecord | undefined): string | undefined {
  if (!config) return undefined
  for (const strategy of config.strategy) {
    if (strategy.hook === "lockHook" && strategy.lockHookConfig.useFixedStartTime) {
      const startTime = strategy.lockHookConfig.startTime?.trim()
      if (startTime) return startTime
    }
  }
  return undefined
}
