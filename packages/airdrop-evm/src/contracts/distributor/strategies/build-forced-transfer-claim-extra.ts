import { type Hash } from "viem"
import { WAD_EVM } from "@repo/airdrop-base/scale"
import { buildEvmClaimExtra } from "./claim-extra"

/**
 * [golden-test] Builds the forced full-`transfer` claim `_extra`: a single
 * strategy taking 100% (`WAD_EVM`) of `claimable` through the `transfer` hook,
 * config index 0, fallback 0. Used by the EVM paymaster (gasless relay) claim,
 * which overrides whatever strategies the batch configured and forces a plain
 * full transfer to the recipient.
 *
 * The relay CO-SIGNS these exact bytes (the ACS-signed and on-chain-verified
 * `_extra` MUST be byte-identical or the co-signature fails), so the output is an
 * idempotency key — pinned by the paymaster golden. The `transfer` encoder
 * ignores `claimAt`, so the bytes are fully deterministic (no wall-clock
 * dependence); no `claimAt` is threaded.
 */
export const buildEvmForcedTransferClaimExtra = (claimable: bigint): Hash =>
  buildEvmClaimExtra({
    configurationIndex: 0,
    strategies: [{ proportion: WAD_EVM, hookType: "transfer" }],
    fallbackHook: 0,
    claimable,
  })
