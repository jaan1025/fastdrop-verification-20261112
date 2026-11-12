// Barrel for the interval family: canonical option lists, duration↔seconds math,
// and the form-validation rules. The pieceDuration codec is NOT here — it lives
// in `schedule/piece-duration.ts` as the single codec home (analysis H2/M2).

export {
  INTERVAL_OPTIONS,
  TIME_UNITS_MODE_0,
  TIME_UNITS_MODE_1,
  TIME_UNITS_ALL,
  UNIT_DAYS,
} from "./options"

export {
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
} from "./seconds"

export { unitsForInterval, unitsValidForInterval, alignedWithInterval } from "./validation"
