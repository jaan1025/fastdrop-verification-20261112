/**
 * Pure user-decline detector. Wallet/device "user explicitly declined" signals
 * must NOT trigger the memo-tx fallback — the user said no, so retrying with a
 * different scheme would just prompt them again.
 *
 *  - `code === 4001`: EIP-1193-style user-rejected (Phantom + most adapters).
 *  - `0x6985`: Ledger APDU "conditions of use not satisfied" (declined on device).
 *  - text markers: reject / declined / cancel.
 */
export const isUserRejection = (error: unknown): boolean => {
  if ((error as { code?: unknown } | null)?.code === 4001) return true
  const text = `${(error as { name?: string } | null)?.name ?? ""} ${
    error instanceof Error ? error.message : String(error)
  }`.toLowerCase()
  return (
    text.includes("0x6985") ||
    text.includes("reject") ||
    text.includes("declined") ||
    text.includes("cancel")
  )
}
