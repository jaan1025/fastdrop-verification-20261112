/**
 * Compare two bytes32 hex strings.
 * Used for merkle tree sorting.
 * @returns -1 if a < b, 1 if a > b, 0 if equal
 */
export const compareBytes32 = (a: string, b: string): number => {
  const aBigInt = BigInt(a)
  const bBigInt = BigInt(b)

  if (aBigInt < bBigInt) return -1
  if (aBigInt > bBigInt) return 1
  return 0
}
