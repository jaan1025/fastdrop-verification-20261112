/**
 * Chain-free shape of the on-chain fee config read back for one approved batch,
 * in raw integer on-chain units (wei/WAD for EVM, lamports/1e9-rate for Solana);
 * both chain arms decode to this union. Formatting to display is the codec's job.
 *
 *   - `fixed`       — a single flat fee.
 *   - `single-tier` — a proportional rate clamped between `minFee`/`maxFee`
 *                     (`0n` = no bound).
 */
export type BatchFeeConfig =
  | { kind: "fixed"; amount: bigint }
  | { kind: "single-tier"; rate: bigint; minFee: bigint; maxFee: bigint }
