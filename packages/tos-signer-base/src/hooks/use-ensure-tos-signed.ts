"use client"

// (internal) Chain-agnostic ensure-ToS-signed orchestration: returns a cached
// signature, or fetches the ACS ToS template → builds the exact message via the
// wire SDK's byte contract → drives the consent dialog via the matched
// `signToS` → caches → returns the signature. The substitution is CONSUMED from
// `@repo/acs-client/model` (`buildToSMessage`), not re-implemented here — that
// byte contract is single-homed in the wire SDK and golden-tested there (§2.7).
// The hook passes an ALREADY chain-formatted address (via the leaf's
// `formatAddressForTemplate`) so it never sniffs a chain.
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { usePersistFn } from "@repo/shared/hooks"
import { buildToSMessage } from "@repo/acs-client/model"
import { usePublicClient } from "@repo/acs-client/react"
import { tosQueryOptions } from "@repo/acs-client/query"

import type {
  EnsureToSSignedDeps,
  EnsureToSSignedMatched,
  EnsureToSSignedParams,
  EnsureToSSignedResult,
} from "../types"

/**
 * Closes over the matched emitter + store hook so the factory can pre-wire them;
 * returns the `useEnsureToSSigned` hook a chain leaf calls with only `address` +
 * optional template hooks.
 */
export const createUseEnsureToSSigned =
  <Address extends string = string, Signature extends string = string, Payload = void>(
    matched: EnsureToSSignedMatched<Address, Signature, Payload>,
  ) =>
  (
    deps: EnsureToSSignedDeps<Address, Signature, Payload>,
  ): EnsureToSSignedResult<Signature, Payload> =>
    useBaseEnsureToSSigned<Address, Signature, Payload>(matched, deps)

/**
 * Returns `{ ensureToSSigned }` (stable via `useAsyncPersistFn`):
 *  1. fetches the ToS doc (keying the matched store on its live hash so reads
 *     and the host's writes share a namespace).
 *  2. runs `validate?.()`; asserts `address` is present.
 *  3. reads the cached signature; returns it on a hit (no dialog).
 *  4. on miss: formats the address via the leaf's `formatAddressForTemplate`,
 *     builds the exact message via the acs-client byte contract `buildToSMessage`.
 *  5. calls `signToS(...)` (typed `SigningOptions<Payload>`, no open index
 *     signature) merged with `getSignExtra?.(params)`, returns the signature.
 * No UX side-effect lives here — the dialog is driven through the host via
 * `signToS` (L2/L8).
 *
 * Stabilized via `usePersistFn` (not the blueprint's `useAsyncPersistFn`, which
 * returns a `[pending, fn]` tuple the ensure surface does not expose).
 */
export const useBaseEnsureToSSigned = <
  Address extends string = string,
  Signature extends string = string,
  Payload = void,
>(
  matched: EnsureToSSignedMatched<Address, Signature, Payload>,
  deps: EnsureToSSignedDeps<Address, Signature, Payload>,
): EnsureToSSignedResult<Signature, Payload> => {
  const {
    address,
    formatAddressForTemplate = (a: Address) => a,
    getSignExtra,
    validate,
    appId,
  } = deps

  const client = usePublicClient()
  const queryClient = useQueryClient()
  const tosQuery = useQuery(tosQueryOptions(client))

  // Key the matched store on the live ToS hash — the same namespace the host
  // writes to on Accept (mirrors the legacy leaf keying its getter on the hash).
  const store = matched.useStore({ identifier: tosQuery.data?.hash ?? "" })

  const ensureToSSigned = usePersistFn(
    async (params: EnsureToSSignedParams<Payload> = {}): Promise<Signature> => {
      validate?.()

      if (!address) {
        throw new Error("Address is required")
      }

      // `appId` override stays callable in isolation/tests; defaults to the
      // public client's app scope (the current `tosQueryOptions(client)` keys on
      // `client.appId`, so the override is a forward-compat knob, not yet wired).
      void appId

      const tosData = tosQuery.data ?? (await queryClient.ensureQueryData(tosQueryOptions(client)))

      if (!tosData) {
        throw new Error("Terms of Service are not available")
      }

      // Resolve the EFFECTIVE payload for this request once — `getSignExtra` (the
      // leaf's chain hook, e.g. EVM `{ payload: { chainId } }`) may override the
      // caller's `params.payload`. The cache READ must key on this same payload as
      // the host's WRITE, or the lookup misses and the dialog re-prompts every claim.
      const extra = getSignExtra?.(params)
      const payload =
        extra && "payload" in extra ? (extra as { payload?: Payload }).payload : params.payload

      const cached = await store.getItem(address, payload)
      if (cached) {
        return cached
      }

      const message = buildToSMessage(tosData.template, {
        address: formatAddressForTemplate(address),
        tosHash: tosData.hash,
      })

      return matched.signToS({
        identifier: tosData.hash,
        content: tosData.content,
        message,
        skipDialog: params.skipDialog,
        ...extra,
        payload,
      })
    },
  )

  return { ensureToSSigned }
}
