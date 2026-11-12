/** Wallet user-rejection / superseded-request errors — not worth a toast. */
export function isCancelled(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  return /cancelled|superseded|rejected/i.test(err.message)
}
