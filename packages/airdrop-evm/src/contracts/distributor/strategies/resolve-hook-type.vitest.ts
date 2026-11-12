import { describe, expect, it } from "vitest"
import type { Address } from "viem"
import { resolveHookType, resolveKnownHookType, type HookContracts } from "./claim-extra"

/**
 * Characterization tests for `resolveHookType` — the pure address classifier
 * that maps an on-chain hook address to its logical {@link HookType}. The golden
 * byte encoders (`buildEvmClaimExtra` / `HOOK_STRATEGY_ENCODERS`) are pinned in
 * claim-extra.test.ts; this file fills the untested classification + guard branches.
 *
 * Two viem facts the implementation leans on (probed against viem at write time):
 *   - `isAddress(x)` defaults to strict (checksum) mode → a mixed-case
 *     non-checksummed string returns `false`, lowercase returns `true`.
 *   - `isAddressEqual` calls `getAddress` internally and THROWS
 *     `InvalidAddressError` on a malformed input. The `candidate` is guarded by
 *     an `isAddress` pre-check; the `target` (the `hookAddress` argument) is NOT
 *     — so a malformed `hookAddress` propagates the throw.
 */

// All-lowercase 20-byte addresses → valid under strict `isAddress`.
const LINEAR: Address = "0x1111111111111111111111111111111111111111"
const LOCK: Address = "0x2222222222222222222222222222222222222222"
const COIN_FLIP: Address = "0x3333333333333333333333333333333333333333"
const CAP: Address = "0x4444444444444444444444444444444444444444"
const UNKNOWN: Address = "0x5555555555555555555555555555555555555555"
const TRANSFER: Address = "0x6666666666666666666666666666666666666666"

const FULL: HookContracts = {
  linearPenalty: LINEAR,
  lock: LOCK,
  transferOrCoinFlip: COIN_FLIP,
  transferWithCap: CAP,
  transfer: TRANSFER,
}

describe("resolveKnownHookType", () => {
  it("only recognizes Transfer at its configured address", () => {
    expect(resolveKnownHookType(TRANSFER, FULL)).toBe("transfer")
    expect(resolveKnownHookType(UNKNOWN, FULL)).toBeUndefined()
    expect(resolveHookType(UNKNOWN, FULL)).toBe("transfer")
  })
})

describe("resolveHookType — classification", () => {
  it("matches each known hook to its type", () => {
    expect(resolveHookType(LINEAR, FULL)).toBe("linear-penalty")
    expect(resolveHookType(LOCK, FULL)).toBe("lock")
    expect(resolveHookType(COIN_FLIP, FULL)).toBe("transfer-or-coin-flip")
    expect(resolveHookType(CAP, FULL)).toBe("transfer-with-cap")
  })

  it('falls back to "transfer" when the address matches no known hook', () => {
    expect(resolveHookType(UNKNOWN, FULL)).toBe("transfer")
  })

  it('falls back to "transfer" against an empty registry', () => {
    expect(resolveHookType(LINEAR, {})).toBe("transfer")
  })

  it("is checksum-insensitive (matches a checksummed target to a lowercase candidate)", () => {
    // isAddressEqual normalizes both sides via getAddress, so a checksummed
    // target matches a lowercase registry candidate (and vice versa).
    const lower = "0xabcdef0123456789abcdef0123456789abcdef01" as Address
    const checksummed = "0xabCDeF0123456789AbcdEf0123456789aBCDEF01" as Address
    expect(resolveHookType(checksummed, { lock: lower })).toBe("lock")
    expect(resolveHookType(lower, { lock: checksummed })).toBe("lock")
  })

  it("honors precedence order: linear-penalty wins over a duplicate later slot", () => {
    // Same address registered as both linearPenalty and lock — the first
    // matching branch (linear-penalty) is returned.
    const dup: HookContracts = { linearPenalty: LINEAR, lock: LINEAR }
    expect(resolveHookType(LINEAR, dup)).toBe("linear-penalty")
  })

  it("precedence: lock checked before coin-flip before cap", () => {
    const dup: HookContracts = {
      lock: LOCK,
      transferOrCoinFlip: LOCK,
      transferWithCap: LOCK,
    }
    expect(resolveHookType(LOCK, dup)).toBe("lock")
  })
})

describe("resolveHookType — malformed candidate guard (matchesHook)", () => {
  it("ignores a malformed registry entry and falls through instead of throwing", () => {
    // `0x1` is not a valid address; the isAddress pre-check skips it, so the
    // call does NOT throw and falls back to the next branch / "transfer".
    const malformedEntry = { lock: "0x1" as Address }
    expect(resolveHookType(LOCK, malformedEntry)).toBe("transfer")
  })

  it("ignores an undefined registry entry (the !!candidate guard)", () => {
    const partial: HookContracts = {
      linearPenalty: undefined,
      lock: LOCK,
    }
    expect(resolveHookType(LOCK, partial)).toBe("lock")
  })

  it("a malformed entry that precedes a valid match does not shadow the match", () => {
    const mixed = {
      linearPenalty: "0xnotanaddress" as Address,
      lock: LOCK,
    }
    expect(resolveHookType(LOCK, mixed)).toBe("lock")
  })
})

describe("resolveHookType — malformed target (hookAddress) is NOT guarded", () => {
  it("throws when the hookAddress is malformed and a candidate comparison is reached", () => {
    // The candidate (LOCK) is valid, so matchesHook reaches isAddressEqual,
    // which calls getAddress on the malformed target → InvalidAddressError.
    // CURRENT behavior: the throw propagates (the legacy .toLowerCase() form
    // would have silently absorbed it).
    expect(() => resolveHookType("0xBAD" as Address, { lock: LOCK })).toThrow()
  })

  it("does NOT throw on a malformed target when the registry is empty (no comparison reached)", () => {
    // With no candidates, no isAddressEqual call happens, so even a garbage
    // target returns "transfer" without throwing.
    expect(resolveHookType("0xBAD" as Address, {})).toBe("transfer")
  })
})
