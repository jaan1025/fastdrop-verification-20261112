/**
 * The literal hook names the Solana merkle-distributor `set-hook` handler
 * (`distributor.rs`) matches — `lockHook`, `transferHook`, `penaltyHook`. The
 * airdrop create flow sends exactly these strings when registering a
 * configuration's strategies. This is the single Solana-side home for that wire
 * vocabulary (relocated from the airdrop-console create flow, L5/S6); EVM has no
 * analogue — it registers a hook by its deployed contract address, not by name.
 *
 * `linearPenaltyHook` ⇒ "penaltyHook" is the one place a strategy kind differs
 * from its wire name. `customHook` maps to "customHook" only for `Record`
 * exhaustiveness: a custom hook self-addresses (its own address goes on the
 * wire), so that entry is never actually sent.
 *
 * [golden] Each literal MUST byte-match a `set-hook` match arm on-chain — a drift
 * silently mis-registers a strategy. Pinned (through the app builder) by
 * `apps/airdrop-console/.../build-strategy-payloads.test.ts`.
 */
export type StrategyHookKind = "lockHook" | "transferHook" | "linearPenaltyHook" | "customHook"

export const SOLANA_HOOK_NAME: Record<StrategyHookKind, string> = {
  lockHook: "lockHook",
  transferHook: "transferHook",
  linearPenaltyHook: "penaltyHook",
  customHook: "customHook",
}
