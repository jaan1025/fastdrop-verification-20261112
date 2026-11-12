/**
 * The distributor fee-config **wire** type. Single home (D10) so both the
 * `set-fee` action and the kit's fee codec (`@repo/console-app-shared`)
 * reference the SAME shape without depending on `/actions`.
 *
 * **Fee VALUES carried here are already pre-encoded to integer scale** by the
 * kit's fee codec, because ACS `set-fee` truncates `with_scale(0)`. This type
 * names field shape only; the `set-fee` action does field-name wire shaping
 * (not scaling).
 */
export type FeeMode =
  { fixedFee: string } | { singleTierFeeRate: { feeRate: string; minFee: string; maxFee: string } }
