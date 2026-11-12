import type { Lamports } from "@solana/kit"

// 1 SOL = 1,000,000,000 lamports (protocol constant)
export const LAMPORTS_PER_SOL = 1_000_000_000n

export const lamportsToSol = (lamportsValue: number | bigint | string | Lamports): number => {
  const lamports = BigInt(lamportsValue)
  const whole = lamports / LAMPORTS_PER_SOL
  const remainder = lamports % LAMPORTS_PER_SOL
  return Number(whole) + Number(remainder) / 1e9
}

export const parseTokenAmount = (
  amount: number | string | bigint,
  decimals: number = 9,
): number => {
  const amountBigInt = BigInt(amount)
  const divisor = BigInt(10 ** decimals)
  const wholePart = amountBigInt / divisor
  const remainder = amountBigInt % divisor
  return Number(wholePart) + Number(remainder) / 10 ** decimals
}

export interface FormatSolOptions {
  /** Fractional digits to keep (TRUNCATED, never rounded). Default 4. */
  decimals?: number
  /** Append a ` SOL` unit suffix. Default false. */
  withUnit?: boolean
}

/**
 * Format a lamports amount as a human-readable SOL DISPLAY STRING.
 *
 * TRUNCATES (slices) the fractional part to `decimals` digits — never rounds —
 * then strips trailing zeros, so `1_999_950_000n` at 4 decimals is `"1.9999"`,
 * not `"2.0000"`. A whole or zero amount has no decimal point: `0n` → `"0"`
 * (or `"0 SOL"` with `withUnit`).
 *
 * This is the string-display counterpart to `lamportsToSol` (which returns a
 * `number`). Both share `LAMPORTS_PER_SOL`.
 */
export const formatSol = (lamports: bigint, options: FormatSolOptions = {}): string => {
  const { decimals = 4, withUnit = false } = options
  const whole = lamports / LAMPORTS_PER_SOL
  const fractional = lamports % LAMPORTS_PER_SOL
  const fractionalStr = fractional.toString().padStart(9, "0").slice(0, decimals).replace(/0+$/, "")
  const body = fractionalStr ? `${whole}.${fractionalStr}` : `${whole}`
  return withUnit ? `${body} SOL` : body
}
