"use client"

// The ONE public entry: `createToSSigner(config)` mints a private channel and
// wires the emitter hook, the headless host hook, the ensure orchestrator, and
// the cache store into one matched set sharing that channel by construction.
// Replaces legacy `createUseSignToS(eventName)` + `BaseToSSigner` + separate
// ensure/store exports, removing the stringly-typed coupling (analysis High #2).
import { createToSChannel } from "./channel"
import { createUseEnsureToSSigned } from "./hooks/use-ensure-tos-signed"
import { createUseSignToS } from "./hooks/use-sign-tos"
import { useToSSignerHost } from "./host/use-host"
import { useToSSignatureStore } from "./store/use-store"
import type {
  EnsureToSSignedDeps,
  EnsureToSSignedResult,
  ToSSigner,
  ToSSignerConfig,
  ToSSignerHostState,
} from "./types"

/**
 * The matched-pair factory. Mints one `ToSChannel`, then composes the emitter,
 * headless host, ensure orchestrator, and cache store — all sharing the private
 * channel token by construction. Each chain SDK calls this exactly once
 * (`@repo/chain-evm-kit/tos-signer`, `@repo/chain-solana-kit/tos-signer`); chain
 * dispatch is by instantiation, not `match` (L4). Adding a chain = one
 * `createToSSigner(config)` call + a chain `config`; no shared file is edited.
 */
export const createToSSigner = <
  Address extends string = string,
  Signature extends string = string,
  Payload = void,
>(
  config: ToSSignerConfig<Address, Signature, Payload>,
): ToSSigner<Address, Signature, Payload> => {
  const channel = createToSChannel<Signature, Payload>()

  const useSignToS = createUseSignToS<Signature, Payload>(channel)

  // The SINGLE store-config binding site: maps the config's storage fields into
  // the cache hook once. Both the host (setItem/removeItem on Accept/failure) and
  // the ensure hook (getItem read) consume this one bound hook, so a new
  // key-field is added here and nowhere else.
  const useToSSignatureStoreBound = (options: { identifier: string }) =>
    useToSSignatureStore<Address, Signature, Payload>({
      identifier: options.identifier,
      storagePrefix: config.storagePrefix,
      lowercaseKeys: config.lowercaseKeys,
      getStorageKey: config.getStorageKey,
    })

  const useToSSignerHostBound = (overrides?: { address?: Address }): ToSSignerHostState =>
    useToSSignerHost<Address, Signature, Payload>({
      channel,
      config,
      useStore: useToSSignatureStoreBound,
      address: overrides?.address,
    })

  const useEnsureToSSigned = (
    deps: EnsureToSSignedDeps<Address, Signature, Payload>,
  ): EnsureToSSignedResult<Signature, Payload> => {
    // Matched emitter + store hook pre-wired so a chain leaf only supplies
    // `address` + optional template hooks. The ensure hook keys the store on the
    // live ToS hash so its read lands in the same namespace the host writes to.
    const { signToS } = useSignToS()
    return createUseEnsureToSSigned<Address, Signature, Payload>({
      signToS,
      useStore: useToSSignatureStoreBound,
    })(deps)
  }

  return {
    useSignToS,
    useToSSignerHost: useToSSignerHostBound,
    useEnsureToSSigned,
    useToSSignatureStore: useToSSignatureStoreBound,
  }
}
