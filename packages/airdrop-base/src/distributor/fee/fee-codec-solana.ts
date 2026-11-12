import type { FeeMode } from "@repo/acs-client/model"

/**
 * Solana fee codec — display ⇄ raw on-chain units (chain-dispatch `-solana`
 * leaf; no viem / no EVM stack). All amounts are **lamports** (1e9 per SOL);
 * the rate is the merkle-distributor's fixed-point scale (`1e9` = 100%, i.e. a
 * decimal proportion ×1e9).
 *
 * No `parseUnits`-style exact decimal→bigint helper exists in `@repo/shared` or
 * `@repo/chain-solana-kit` (`toBigInt` rejects non-zero fractions; `lamportsToSol`
 * / `parseTokenAmount` route through `Number`), so this leaf carries its own
 * string-based parse — split on ".", pad/truncate the fraction to `decimals`,
 * concatenate, take `BigInt`. No float math touches amounts.
 */

/** SOL/lamports scale and the rate scale are both 1e9 on Solana. */
const SCALE_DECIMALS = 9

/** Lamports-per-percent: a rate of `1e7` reads as `1%` (`1e9` = 100%). */
const SCALE_PER_PERCENT = 10n ** 7n

const orZero = (value: string): string => (value.trim() === "" ? "0" : value)

/**
 * Exact decimal→bigint at a fixed scale, string-only (no float).
 * `"0.05"` @ 9 → `50000000n`; `"1"` @ 9 → `1000000000n`. Extra fractional
 * digits beyond `decimals` are truncated (mirrors viem `parseUnits`).
 */
function decimalToScaled(value: string, decimals: number): bigint {
  const trimmed = orZero(value).trim()
  const negative = trimmed.startsWith("-")
  const unsigned = negative ? trimmed.slice(1) : trimmed
  const [wholePart = "0", fracPart = ""] = unsigned.split(".")
  const frac = fracPart.slice(0, decimals).padEnd(decimals, "0")
  const magnitude = BigInt(`${wholePart || "0"}${frac}`)
  return negative ? -magnitude : magnitude
}

/** Encode one display `FeeMode` into raw integer-string wire units. */
export function encodeFeeModeSolana(display: FeeMode): FeeMode {
  if ("fixedFee" in display) {
    return {
      fixedFee: decimalToScaled(display.fixedFee, SCALE_DECIMALS).toString(),
    }
  }
  const { feeRate, minFee, maxFee } = display.singleTierFeeRate
  return {
    singleTierFeeRate: {
      feeRate: decimalToScaled(feeRate, SCALE_DECIMALS).toString(),
      minFee: decimalToScaled(minFee, SCALE_DECIMALS).toString(),
      maxFee: decimalToScaled(maxFee, SCALE_DECIMALS).toString(),
    },
  }
}

/** Raw lamports → trimmed SOL decimal string (e.g. `5e7` → "0.05"). */
export function formatAmountSolana(raw: bigint): string {
  return trimDecimal(scaledToDecimal(raw, SCALE_DECIMALS))
}

/** Raw rate → trimmed percent string (e.g. `5e7` → "5", i.e. 5%). */
export function formatRateSolana(rate: bigint): string {
  return trimDecimal(divToDecimal(rate, SCALE_PER_PERCENT))
}

/** Raw scaled integer → fixed-`decimals` decimal string (untrimmed). */
function scaledToDecimal(value: bigint, decimals: number): string {
  return divToDecimal(value, 10n ** BigInt(decimals))
}

/**
 * Integer division to a decimal string against a power-of-ten `divisor`, no
 * float math. The fractional width is `divisor`'s digit count minus one.
 */
function divToDecimal(value: bigint, divisor: bigint): string {
  const sign = value < 0n ? "-" : ""
  const abs = value < 0n ? -value : value
  const whole = abs / divisor
  const remainder = abs % divisor
  if (remainder === 0n) return `${sign}${whole}`
  const fracWidth = divisor.toString().length - 1
  const frac = remainder.toString().padStart(fracWidth, "0")
  return `${sign}${whole}.${frac}`
}

/** Drop trailing zeros (and a bare trailing dot) from a decimal string. */
function trimDecimal(value: string): string {
  if (!value.includes(".")) return value
  return value.replace(/\.?0+$/, "")
}
