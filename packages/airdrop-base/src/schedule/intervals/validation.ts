import type { TimeUnit, UnlockInterval } from "../types"
import { TIME_UNITS_ALL, TIME_UNITS_MODE_0, TIME_UNITS_MODE_1 } from "./options"
import { intervalMonths, isCalendarMode, unitToMonths } from "./seconds"

/**
 * Interval/unit pairing + alignment rules consumed by the apps' Zod schedule-form
 * schemas. Pure predicates only — no Zod import here (the kernel exposes the
 * rules; the apps wrap them in their schemas).
 */

export function unitsForInterval(interval: UnlockInterval): readonly TimeUnit[] {
  if (interval === "continuous") return TIME_UNITS_ALL
  if (isCalendarMode(interval)) return TIME_UNITS_MODE_1
  return TIME_UNITS_MODE_0
}

export function unitsValidForInterval(interval: UnlockInterval, unit: TimeUnit): boolean {
  if (interval === "continuous") return true
  if (isCalendarMode(interval)) return TIME_UNITS_MODE_1.includes(unit)
  return TIME_UNITS_MODE_0.includes(unit)
}

export function alignedWithInterval(params: {
  interval: UnlockInterval
  value: number
  unit: TimeUnit
}): boolean {
  const { interval, value, unit } = params
  if (interval === "continuous") return true
  if (isCalendarMode(interval)) {
    if (!TIME_UNITS_MODE_1.includes(unit)) return false
    const months = value * unitToMonths(unit)
    const step = intervalMonths(interval)
    return step > 0 && months % step === 0
  }
  if (interval === "daily") {
    return unit === "days" || unit === "weeks"
  }
  if (interval === "weekly") {
    if (unit === "weeks") return true
    if (unit === "days") return value % 7 === 0
  }
  return false
}
