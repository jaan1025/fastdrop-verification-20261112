/**
 * SquadsX detection — the Squads-specific predicate the Solana tx pipeline uses
 * to recognise the multisig wallet. (Parallel to the EVM kit's
 * `safe/detect.ts::isSafeAccount`, except Solana reads the connected wallet
 * adapter's `name` synchronously where EVM must probe `getThreshold()`.)
 */
export const isSquadsXWallet = (wallet?: { name: string } | null): boolean =>
  wallet?.name === "SquadsX"
