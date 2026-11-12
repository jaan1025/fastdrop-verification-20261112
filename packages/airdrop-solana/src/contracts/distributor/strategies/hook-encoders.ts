import { HookType } from "../generated/types/hookType"
import {
  concatBytes,
  encodeBytes,
  encodeI64LE,
  encodeU32LE,
  encodeU64LE,
} from "@repo/chain-solana-kit/utils"

// ---------------------------------------------------------------------------
// Per-hook `_extra` data serializers (Borsh: all integers little-endian, via
// utils/bytes). Parallel to the EVM arm's `hook-encoders.ts`
// (`HOOK_STRATEGY_ENCODERS`) — the per-hook encoders the claim-extra builder
// dispatches to. `[golden]` — these bytes are byte-signed by the ACS relay and
// byte-verified on-chain; they must never change.
// ---------------------------------------------------------------------------

/** TransferHookData / LockHookData { amount: u64 } — 8 bytes */
const serializeAmountData = (amount: bigint): Uint8Array => encodeU64LE(amount)

/** PenaltyHookData { amount: u64, claim_at: i64 } — 16 bytes */
const serializePenaltyData = (amount: bigint, claimAt: bigint): Uint8Array =>
  concatBytes(encodeU64LE(amount), encodeI64LE(claimAt))

/**
 * Per-strategy `_extra` encoder. Pure: the Penalty payload's `claim_at` is
 * injected (no clock read here) — the caller resolves the timestamp at the
 * orchestration edge (see `buildClaimExtra`).
 */
export const serializeStrategyData = (
  hookType: HookType,
  amount: bigint,
  claimAt: bigint,
): Uint8Array => {
  if (hookType === HookType.Penalty) {
    return serializePenaltyData(amount, claimAt)
  }
  return serializeAmountData(amount)
}

/** Borsh `Vec<Vec<u8>>` serializer (= the on-chain `HookDataInput`). */
export const serializeHookDataInput = (items: Uint8Array[]): Uint8Array =>
  concatBytes(encodeU32LE(items.length), ...items.map(encodeBytes))
