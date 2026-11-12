/**
 * [contract-mirror] The EVM arm of the penalty curve — bit-for-bit mirror of
 * `LinearPenaltyHook.getPenalty`: a HARDCODED 100%→0 linear decay with a SINGLE
 * floored division (`amount * restTime / totalTime`). The contract has no
 * start/end penalty parameters; do NOT generalize this arm onto the Solana
 * rate-interpolation shape — the two floor differently.
 */
export function evmPenaltyAmount(
  amount: bigint,
  terms: { beginTime: bigint; endTime: bigint },
  claimAt: bigint,
): bigint {
  if (claimAt < terms.beginTime) return amount
  if (claimAt >= terms.endTime) return 0n
  const restTime = terms.endTime - claimAt
  const totalTime = terms.endTime - terms.beginTime
  return (amount * restTime) / totalTime
}
