/**
 * `minuend − subtrahend`, floored at zero, with undefined propagation: an
 * unknown operand yields an unknown result rather than a fabricated number.
 */
export const saturatingSub = (
  minuend: bigint | undefined,
  subtrahend: bigint | undefined,
): bigint | undefined => {
  if (minuend === undefined || subtrahend === undefined) return undefined
  return minuend > subtrahend ? minuend - subtrahend : 0n
}
