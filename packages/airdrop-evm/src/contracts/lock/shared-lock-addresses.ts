import { type Address, zeroAddress } from "viem"

/**
 * Pre-deployed CliqueLock (per-stream escrow) contracts that are SHARED
 * across all streams on a given chain. Used as `StreamPreset.lock` in
 * calls to `CliqueLockHook.setStreamPreset(...)`.
 *
 * Two contracts, distinct roles — don't confuse them:
 *   - CliqueLockHook = orchestrator. One deployment per chain, address
 *     comes from the backend (`deployment.roles["lockHook"]`).
 *   - CliqueLock    = per-stream escrow. THIS file.
 *
 * Semantics on-chain (CliqueLockHook.sol `execute`):
 *   - non-zero `lock` → reuse this existing CliqueLock across every
 *     preset on the chain. Saves gas vs. redeploying.
 *   - zero `lock`     → CliqueLockHook auto-deploys a fresh CliqueLock
 *     at first execute() and writes the address back into the preset.
 *
 * This map is therefore OPTIONAL — a missing chain is not a bug. It
 * just means each preset gets its own CliqueLock on first claim. Add
 * an entry only after a shared CliqueLock has been deployed on that
 * chain and the gas saving is wanted.
 *
 * Ported from vesting-dashboard (packages/acs-atoms/src/core/app.ts).
 * Source of truth lives here — the ACS server does NOT store per-chain
 * CliqueLock addresses (only `lockHook` lives in `deployment.roles`).
 */
const SHARED_LOCK_ADDRESSES: Record<string, Address> = {
  "11155111": "0x6F2129707D90F1dD85bd3659D33E8645C3670075", // Sepolia
}

/**
 * Returns the chain's shared CliqueLock, or `zeroAddress` when none has
 * been pre-deployed. Zero is a valid input to `setStreamPreset` — the
 * CliqueLockHook will auto-deploy a CliqueLock per preset at first
 * execute().
 */
export const getSharedLockAddress = (chainId: number | string): Address =>
  SHARED_LOCK_ADDRESSES[String(chainId)] ?? zeroAddress
