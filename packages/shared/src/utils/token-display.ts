import { floor } from "./floor"
import { isNil } from "./predicate"

export const toLocaleString = (value: number, options?: Intl.NumberFormatOptions) => {
  if (isNil(value)) return ""
  const precision = options?.maximumFractionDigits ?? 3
  const _value = floor(value, precision)
  return _value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
    ...options,
  })
}

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER)

/**
 * Format a token amount for display. Default 6-decimal cap preserves
 * 4-place precision typical of allocation data without truncating
 * `0.000123` to `0.000`. Override `maxDecimals` for native gas (smaller)
 * or stat tiles (larger).
 */
export const formatTokenNumber = (n: number, maxDecimals = 6): string => {
  if (!Number.isFinite(n)) return "0"
  return n.toLocaleString(undefined, { maximumFractionDigits: maxDecimals })
}

/**
 * Convert an on-chain `bigint` token amount to a JS `number` for display /
 * comparison. Builds the decimal string manually rather than going through
 * `viem.formatUnits` so `@repo/shared` stays chain-agnostic.
 *
 * Returns the closest finite `number`, or `0` when conversion yields a
 * non-finite result. Precision loss above `Number.MAX_SAFE_INTEGER` is silent
 * (L8: no `console.*` in shipped paths; this is a pure display util, not the
 * place for a logger). `MAX_SAFE_BIGINT` is retained as the documented
 * boundary; aggregation / arithmetic should stay in `bigint` upstream.
 */
export const bigIntToDisplayNumber = (value: bigint, decimals: number): number => {
  if (decimals <= 0) {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }
  const factor = 10n ** BigInt(decimals)
  const abs = value < 0n ? -value : value
  const sign = value < 0n ? "-" : ""
  const whole = abs / factor
  const wholeStr = whole.toString()
  const fractionStr = (abs % factor).toString().padStart(decimals, "0").replace(/0+$/, "")
  const decimalStr = fractionStr ? `${sign}${wholeStr}.${fractionStr}` : `${sign}${wholeStr}`
  const n = Number(decimalStr)
  return Number.isFinite(n) ? n : 0
}

/**
 * Nil-tolerant display formatter for an on-chain raw amount: returns `0` for
 * nil/non-finite, otherwise delegates to `bigIntToDisplayNumber`. Stays
 * chain-agnostic (no viem). Consolidates the per-file `formatBigintAmount`
 * copies in console-kit funding hooks.
 */
export const formatBigintAmount = (raw: bigint | undefined, decimals: number): number => {
  if (raw == null) return 0
  return bigIntToDisplayNumber(raw, decimals)
}

/**
 * Convert a raw on-chain amount *string* (base units) to a display `number`,
 * shifted by token decimals. Tolerant of empty / malformed input → `0`. When
 * the string does not parse as a `bigint`, a `decimals <= 0` reading falls back
 * to `Number(raw) || 0` (so a plain decimal like `"1.5"` still surfaces),
 * otherwise yields `0`. Chain-agnostic (no viem).
 */
export const parseRawAmount = (raw: string, decimals: number): number => {
  if (!raw) return 0
  try {
    return bigIntToDisplayNumber(BigInt(raw), decimals)
  } catch {
    return decimals <= 0 ? Number(raw) || 0 : 0
  }
}

/**
 * Parse a human decimal string into integer base-units (`bigint`), shifted by
 * `decimals`. A chain-dep-free, byte-faithful reimplementation of viem
 * `parseUnits` — `@repo/shared` must not import viem, so this is pure string
 * math (the magnitude is assembled from digit strings, never `Number()`, so
 * 18-decimal values keep full precision).
 *
 * BYTE-CRITICAL: the fee-codec encodes amounts the relay later truncates with
 * `with_scale(0)`, making the output an idempotency key. This MUST stay
 * byte-identical to viem `parseUnits` for every shape the call sites pass —
 * pinned in `parse-decimal.test.ts` against viem's actual outputs.
 *
 * Semantics (verbatim viem):
 * - The fractional part is **round-half-up** to `decimals` digits, NOT
 *   truncated; a `…9`-overflow carries into the integer part
 *   (`"1.999999999",4 → 20000n`, `"9.9999",2 → 1000n`). The rounding uses a
 *   `Math.round` on a 1–2-digit slice only — float-safe, never the magnitude.
 * - `decimals === 0` rounds the whole fraction into the integer.
 * - A fraction shorter than `decimals` is right-padded with zeros.
 * - Empty string → `0n`; leading/trailing zeros are normalized; a bare leading
 *   (`".5"`) or trailing (`"5."`) dot is legal; a leading `-` is honored.
 * - Anything outside `/^(-?)([0-9]*)\.?([0-9]*)$/` throws (no silent coercion —
 *   a malformed idempotency key must never be fabricated). Call sites already
 *   guard (`TopUpAmountModal` try/catch; fee-codec only passes digit strings).
 */
export const parseDecimalAmount = (value: string, decimals: number): bigint => {
  if (!/^(-?)([0-9]*)\.?([0-9]*)$/.test(value)) {
    throw new Error(`parseDecimalAmount: invalid decimal number "${value}"`)
  }
  let [integer = "", fraction = "0"] = value.split(".")
  const negative = integer.startsWith("-")
  if (negative) integer = integer.slice(1)

  // Trim trailing zeros so the rounding window sees only significant digits.
  fraction = fraction.replace(/(0+)$/, "")

  if (decimals === 0) {
    // Round the entire fraction; an overflow (`.5` and up) carries +1.
    if (Math.round(Number(`.${fraction}`)) === 1) {
      integer = `${BigInt(integer || "0") + 1n}`
    }
    fraction = ""
  } else if (fraction.length > decimals) {
    // Round-half-up at the `decimals`-th fractional digit.
    const left = fraction.slice(0, decimals - 1)
    const unit = fraction.slice(decimals - 1, decimals)
    const right = fraction.slice(decimals)
    const rounded = Math.round(Number(`${unit}.${right}`))
    if (rounded > 9) {
      fraction = `${BigInt(left) + 1n}0`.padStart(left.length + 1, "0")
    } else {
      fraction = `${left}${rounded}`
    }
    // The rounding may push the fraction one digit too long → carry into int.
    if (fraction.length > decimals) {
      fraction = fraction.slice(1)
      integer = `${BigInt(integer || "0") + 1n}`
    }
    fraction = fraction.slice(0, decimals)
  } else {
    fraction = fraction.padEnd(decimals, "0")
  }

  return BigInt(`${negative ? "-" : ""}${integer}${fraction}`)
}
