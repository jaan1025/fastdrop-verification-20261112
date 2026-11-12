import { formatUnits, parseUnits } from "viem"
import { match } from "@repo/shared/utils"
import type { ChainKind } from "@repo/acs-client/model"

/**
 * [golden-test] The ONE scale table for the kernel. A sanctioned both-chain
 * contract (L4 carve-out): EVM 1e18 and Solana 1e9 sit side by side and must
 * agree forever — never unified, never redeclared elsewhere (analysis H3).
 *
 * All converters carry an explicit `ChainKind`; `wad` is derived FROM the kind
 * via `wadFor`, never the reverse (no `wad === 1e18` sniff — analysis M1).
 */

/** Whole-amount denominator: `1` == 100%. EVM 1e18. */
export const WAD_EVM = 10n ** 18n
/** Whole-amount denominator: `1` == 100%. Solana 1e9. */
export const WAD_SOL = 10n ** 9n
/** Basis-points denominator for the Solana bps→wad conversion. */
export const BPS = 10_000n

/**
 * Contract scale for unlock / penalty percentages, per chain.
 *   EVM:    18-decimal wad (10% = 0.1 · 10^18 = 10^17)
 *   Solana: 4 decimals (basis points × 100; matches the on-chain bps × 100 wad)
 */
export const PERCENT_DECIMALS: Record<ChainKind, number> = {
  evm: 18,
  solana: 4,
}

/** Explicit `chainKind → wad` derivation (so callers carry `chainKind`, not `wad`). */
export function wadFor(chainKind: ChainKind): bigint {
  return match(chainKind, {
    evm: () => WAD_EVM,
    solana: () => WAD_SOL,
  })
}

/**
 * Form percent (0–100) → contract-scaled wad string. The single write-side
 * scaler shared by every form→wire builder and on-chain payload builder.
 */
export function toWadPercent(percent: number, chainKind: ChainKind): string {
  return parseUnits(String(percent / 100), PERCENT_DECIMALS[chainKind]).toString()
}

/**
 * Contract-scaled wad → form percent (0–100), rounded to 2dp. The read-side
 * inverse of `toWadPercent`. Throws on unparseable input rather than silently
 * returning 0 (analysis L4) — a caller that wants a default must supply it.
 */
export function percentFromWad(raw: string | bigint | undefined, chainKind: ChainKind): number {
  if (raw === undefined || raw === null) {
    throw new Error("percentFromWad: missing raw value")
  }
  const big = typeof raw === "bigint" ? raw : BigInt(raw)
  const num = parseFloat(formatUnits(big, PERCENT_DECIMALS[chainKind])) * 100
  return Math.round(num * 100) / 100
}

/**
 * Solana basis-point-x100 scale (10_000 = 100%) → percent, rounded 2dp. The one
 * home for the bps→percent step (was duplicated in `preset.ts` — analysis H3).
 */
export function percentFromBps(bps: number): number {
  return Math.round((bps / 100) * 100) / 100
}

/**
 * [golden-test] Form percent (0–100) → basis-points integer (`Math.round(pct *
 * 100)`, 1000 = 10%). The integer-bps quantization step legacy
 * `percentageToBps` uses for the configuration set-hook `proportion` and the
 * linear-penalty bounds.
 */
export function toBps(percent: number): bigint {
  return BigInt(Math.round(percent * 100))
}

/**
 * [golden-test] Form percent (0–100) → contract-scaled wad string VIA integer
 * basis points (legacy `bpsTo{Evm,Solana}Wad` path). Used for the configuration
 * `proportion` (set-hook) and the linear-penalty bounds.
 *
 * DELIBERATELY DISTINCT from `toWadPercent` — DO NOT merge. The two take
 * different rounding paths and DIVERGE on sub-bps-precise percents:
 *   - `toWadPercentViaBps` first quantizes to integer basis points (`toBps`), THEN scales
 *     to wad: `toWadPercentViaBps(12.345, 'evm') = 123500000000000000` (12.34 → 1234 bps).
 *   - `toWadPercent` keeps full float precision via `parseUnits(pct / 100)`:
 *     `toWadPercent(12.345, 'evm') = 123450000000000000`.
 * Each mirrors a different legacy code path and must stay byte-identical to its
 * own. Using the wrong one forks the on-chain `proportion`/penalty bytes.
 */
export function toWadPercentViaBps(percent: number, chainKind: ChainKind): string {
  return ((toBps(percent) * wadFor(chainKind)) / BPS).toString()
}
