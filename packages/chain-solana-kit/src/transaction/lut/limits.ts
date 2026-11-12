/** Address Lookup Table size constants. */

/** Hard cap on a single Address Lookup Table (Solana ALT limit). */
export const LUT_MAX_ADDRESSES = 256

/**
 * Max addresses per `extend` instruction (each is ~32 bytes of ix data). Also the
 * size of the create+first-chunk tx in `ensureLutCovers`. Held at 25 (not the
 * theoretical ~30 ceiling) so that combined tx keeps real headroom under the
 * 1232-byte v0 limit — create + extend(30) lands at EXACTLY 1232 (zero margin),
 * which any future compute-budget / priority-fee instruction would tip over.
 * `tx-size.test.ts` pins this against the real serializer.
 */
export const ADDRESSES_PER_EXTEND = 25
