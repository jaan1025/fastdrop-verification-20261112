import { keccak256, toBytes } from "viem"
import { toIsoString } from "@repo/shared/utils"

/**
 * [golden-test] Deterministic airdrop configuration code — last 8 hex of a
 * keccak over the canonical strategy spec. Byte output is an on-chain
 * idempotency key (it derives the preset / penalty-config slot key via
 * `hashConfigurationCode`), so it must stay byte-identical: same settings → same
 * code (idempotent create/overwrite), mirroring how `deriveScheduleCode` keys a
 * vesting schedule.
 *
 * The input is the structural shape of the airdrop-console New Configuration
 * form (`ConfigurationFormValues`). It is declared here, not imported from the
 * app, because a package may not depend on an app — the app's form values
 * structurally satisfy these types. Keep these in lock-step with
 * `apps/airdrop-console/.../configuration-form-schema.ts`.
 */

/** Form/display time units a lock strategy uses (percents 0–100, ISO datetimes). */
export type ConfigTimeUnit = "days" | "weeks" | "months" | "quarters" | "years"

/** Unlock cadence a lock strategy uses. */
export type ConfigInterval = "continuous" | "daily" | "weekly" | "monthly" | "quarterly" | "yearly"

export type LockHookConfigInput = {
  useFixedStartTime: boolean
  startTime: string
  cliffValue: number
  cliffUnit: ConfigTimeUnit
  durationValue: number
  durationUnit: ConfigTimeUnit
  unlockInterval: ConfigInterval
  startUnlockPercent: number
  cliffUnlockPercent: number
}

export type PenaltyConfigInput = {
  beginTime: string
  endTime: string
  startPenalty: number
  endPenalty: number
}

/** A single distribution strategy, discriminated by `hook`. */
export type StrategyCodeInput =
  | { hook: "lockHook"; proportion: number; lockHookConfig: LockHookConfigInput }
  | { hook: "linearPenaltyHook"; proportion: number; penaltyConfig: PenaltyConfigInput }
  | { hook: "customHook"; proportion: number; customAddress: string }
  | { hook: "transferHook"; proportion: number }

/** The identity-defining slice of a configuration form (description excluded). */
export type ConfigurationCodeInput = {
  displayName: string
  strategies: StrategyCodeInput[]
  fallbackIdx: string
}

// Canonical, stable projection of the identity-defining fields. Key order is
// fixed by literal construction; arrays preserve order; flexible-start times are
// normalized to "" so they don't perturb the code. The display name IS part of
// identity — mirroring deriveScheduleCode, which hashes the schedule name — so
// two same-strategy configurations with different names coexist instead of
// silently overwriting each other. Description stays a label (excluded).
function canonicalStrategy(s: StrategyCodeInput): unknown {
  switch (s.hook) {
    case "lockHook": {
      const c = s.lockHookConfig
      return {
        hook: s.hook,
        proportion: s.proportion,
        lockHookConfig: {
          useFixedStartTime: c.useFixedStartTime,
          // Canonical Z-ISO so the code is instant-addressed, not spelling-
          // addressed (see deriveScheduleCode). Empty = flexible start.
          startTime: c.useFixedStartTime && c.startTime ? toIsoString(c.startTime) : "",
          cliffValue: c.cliffValue,
          cliffUnit: c.cliffUnit,
          durationValue: c.durationValue,
          durationUnit: c.durationUnit,
          unlockInterval: c.unlockInterval,
          startUnlockPercent: c.startUnlockPercent,
          cliffUnlockPercent: c.cliffUnlockPercent,
        },
      }
    }
    case "linearPenaltyHook": {
      const p = s.penaltyConfig
      return {
        hook: s.hook,
        proportion: s.proportion,
        penaltyConfig: {
          beginTime: p.beginTime ? toIsoString(p.beginTime) : "",
          endTime: p.endTime ? toIsoString(p.endTime) : "",
          startPenalty: p.startPenalty,
          endPenalty: p.endPenalty,
        },
      }
    }
    case "customHook":
      return {
        hook: s.hook,
        proportion: s.proportion,
        customAddress: s.customAddress,
      }
    case "transferHook":
      return { hook: s.hook, proportion: s.proportion }
  }
}

export function deriveConfigurationCode(values: ConfigurationCodeInput): string {
  const canonical = {
    displayName: values.displayName.trim(),
    strategies: values.strategies.map(canonicalStrategy),
    fallbackIdx: values.fallbackIdx,
  }
  return keccak256(toBytes(JSON.stringify(canonical))).slice(-8)
}

/**
 * 32-byte keccak hash of an airdrop configuration code — the on-chain key the
 * lock preset and penalty-config slots are stored under (`keccak256(configId)`;
 * the relay handlers `from_hex` it). This is airdrop's analogue of the lock-side
 * `hashScheduleCode`: the byte recipe is identical (`keccak256(toBytes(code))`)
 * but the input is a configuration code (from `deriveConfigurationCode`), not a
 * vesting scheduleCode — the two stay named apart so each domain keys by its own
 * code without an implied "a configuration IS a schedule" coupling.
 */
export function hashConfigurationCode(configurationCode: string): `0x${string}` {
  return keccak256(toBytes(configurationCode))
}
