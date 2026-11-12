import { formatEther } from "viem"
import { parseDecimalAmount } from "@repo/shared/utils"
import type { FeeMode } from "@repo/acs-client/model"

/**
 * EVM fee codec — display ⇄ raw on-chain units (chain-dispatch `-evm` leaf).
 * All amounts are **wei** (1e18); the rate is **WAD** (`1e18` = 100%, i.e. a
 * decimal proportion ×1e18).
 *
 * The display rate is a decimal *proportion* (`"0.05"` = 5%), so encoding it is
 * `parseDecimalAmount(value, 18)` (`"0.05"` → `5e16`) and decoding back to a
 * percent string divides by `1e16` (`5e16` → `"5"`). Amounts never round-trip
 * through `Number`: `parseDecimalAmount` is a pure viem-`parseUnits`-equivalent
 * (round-half-up) decimal→bigint, and `formatEther` keeps the decode exact.
 */

/** WAD-per-percent: a rate of `1e16` (WAD) reads as `1%`. */
const WAD_PER_PERCENT = 10n ** 16n

/**
 * Empty / whitespace-only → `"0"`; otherwise the value is passed through
 * UNTRIMMED. `parseDecimalAmount` rejects surrounding whitespace exactly as the
 * prior viem `parseEther`/`parseUnits` did, so a padded numeric input throws
 * identically (strict byte-parity with the pre-sink behavior — do not trim).
 */
const orZero = (value: string): string => (value.trim() === "" ? "0" : value)

/** Encode one display `FeeMode` into raw integer-string wire units. */
export function encodeFeeModeEvm(display: FeeMode): FeeMode {
  if ("fixedFee" in display) {
    return { fixedFee: parseDecimalAmount(orZero(display.fixedFee), 18).toString() }
  }
  const { feeRate, minFee, maxFee } = display.singleTierFeeRate
  return {
    singleTierFeeRate: {
      feeRate: parseDecimalAmount(orZero(feeRate), 18).toString(),
      minFee: parseDecimalAmount(orZero(minFee), 18).toString(),
      maxFee: parseDecimalAmount(orZero(maxFee), 18).toString(),
    },
  }
}

/** Raw wei → trimmed decimal native-unit string (e.g. `5e16` → "0.05"). */
export function formatAmountEvm(raw: bigint): string {
  return formatEther(raw)
}

/** Raw WAD rate → trimmed percent string (e.g. `5e16` WAD → "5", i.e. 5%). */
export function formatRateEvm(rate: bigint): string {
  return trimDecimal(divToDecimal(rate, WAD_PER_PERCENT))
}

/**
 * Integer division to a decimal string with up to 18 fractional digits, no
 * float math. `value / divisor` where `divisor` is a power of ten with at most
 * 18 digits (WAD_PER_PERCENT = 1e16).
 */
function divToDecimal(value: bigint, divisor: bigint): string {
  const sign = value < 0n ? "-" : ""
  const abs = value < 0n ? -value : value
  const whole = abs / divisor
  const remainder = abs % divisor
  if (remainder === 0n) return `${sign}${whole}`
  // divisor is 10**k; its decimal width is digits-1.
  const fracWidth = divisor.toString().length - 1
  const frac = remainder.toString().padStart(fracWidth, "0")
  return `${sign}${whole}.${frac}`
}

/** Drop trailing zeros (and a bare trailing dot) from a decimal string. */
function trimDecimal(value: string): string {
  if (!value.includes(".")) return value
  return value.replace(/\.?0+$/, "")
}
