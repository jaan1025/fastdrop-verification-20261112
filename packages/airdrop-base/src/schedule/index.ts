// Curated barrel for the `@repo/airdrop-base/schedule` subpath — the SCHEDULE
// family: the product's vesting-schedule authoring DSL. Form vocabulary
// (ScheduleInput / TimeUnit / UnlockInterval), the derived render model
// (`Schedule`), the scheduleCode identity grammar, the protocol-exact
// duration↔seconds math, the two duration-lowering models (behind their own
// doors), and the on-chain-preset → Schedule read projection. Sits ABOVE the
// chain mirror: composes `distributor` + `stream` + `scale`.

export { deriveSchedule } from "./derive"

export {
  deriveScheduleCode,
  hashScheduleCode,
  scheduleCodeHashBytes,
  toScheduleCodeProjection,
} from "./code"

export type {
  Schedule,
  ScheduleInput,
  ScheduleCodeProjection,
  UnlockInterval,
  TimeUnit,
} from "./types"

export { encodePieceDuration, pieceDurationToInterval } from "./piece-duration"
export type { PieceDurationDecodeResult } from "./piece-duration"

export {
  INTERVAL_OPTIONS,
  TIME_UNITS_MODE_0,
  TIME_UNITS_MODE_1,
  TIME_UNITS_ALL,
  UNIT_DAYS,
  isCalendarMode,
  intervalMonths,
  intervalSeconds,
  unitToMonths,
  unitToSeconds,
  calendarMonthDurationSeconds,
  defaultReferenceUnixSeconds,
  durationToSeconds,
  durationFromSeconds,
  fixedSpanSeconds,
  unitsForInterval,
  unitsValidForInterval,
  alignedWithInterval,
} from "./intervals"

export { presetToSchedule, presetLockAddress, isPresetDeployed } from "./from-preset"

// Off-chain Schedule → StreamTerms (pre-claim quotes via the claimable twin).
export { streamTermsFromSchedule } from "./stream-terms"
