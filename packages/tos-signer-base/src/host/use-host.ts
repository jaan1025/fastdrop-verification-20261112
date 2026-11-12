"use client"

// (internal) The headless ToS host hook: subscribes to the private channel,
// drives the pure state machine, and on Accept runs `ensureReady` →
// `signMessage` → cache-write → resolve the awaiting `signToS` promise (reject +
// cache-clear on Cancel/failure). Returns the `ToSSignerHostState` an app's
// consent slot renders — NO UX side-effect, NO `@repo/ui` (analysis High #1).
// Bound to one `ToSChannel` by the factory.
import { useReducer, useRef } from "react"
import { usePersistFn } from "@repo/shared/hooks"
import { runInNextTick } from "@repo/shared/utils"

import type { ToSChannel } from "../channel"
import type {
  SigningOptions,
  ToSSignatureStore,
  ToSSignerConfig,
  ToSSignerHostState,
} from "../types"
import { initialToSHostState, tosHostReducer, type ToSHostMachineState } from "./machine"

interface Deferred<Signature> {
  resolve: (signature: Signature) => void
  reject: (reason?: unknown) => void
}

export const useToSSignerHost = <
  Address extends string = string,
  Signature extends string = string,
  Payload = void,
>(args: {
  channel: ToSChannel<Signature, Payload>
  config: ToSSignerConfig<Address, Signature, Payload>
  /**
   * The already-bound cache store hook from the factory (the SINGLE store-config
   * binding site). The host calls it with the in-flight request identifier and
   * uses only `setItem`/`removeItem`; it never re-derives storage config, so it
   * stays config-shape-agnostic about how the key is built.
   */
  useStore: (options: { identifier: string }) => ToSSignatureStore<Address, Signature, Payload>
  address?: Address
}): ToSSignerHostState => {
  const { channel, config, useStore, address } = args

  const [state, dispatch] = useReducer(
    tosHostReducer<Payload>,
    undefined,
    initialToSHostState<Payload>,
  )

  // Keep the latest machine state readable from persisted callbacks without
  // re-binding them each render.
  const stateRef = useRef<ToSHostMachineState<Payload>>(state)
  stateRef.current = state

  // The awaiting emitter's settle handles for the in-flight request.
  const deferredRef = useRef<Deferred<Signature> | null>(null)

  // Settle the in-flight deferred AT MOST ONCE. Capture+null `deferredRef`
  // atomically before invoking the handle, so a concurrent settle/cancel that
  // races the in-flight sign (e.g. confirm-then-cancel, or cancel during the
  // 20ms resolve delay) sees an already-consumed slot and becomes a no-op
  // instead of double-settling or rejecting a resolved promise. Resolve and
  // reject share this guard so the two settle paths are symmetric.
  const consumeDeferred = (): Deferred<Signature> | null => {
    const deferred = deferredRef.current
    deferredRef.current = null
    return deferred
  }

  const identifier = state.request?.identifier ?? ""
  const { setItem, removeItem } = useStore({ identifier })

  const sign = usePersistFn(async (request: SigningOptions<Payload>) => {
    if (!address) {
      throw new Error(config.missingAddressError ?? "Connect your wallet first.")
    }
    if (!request.message) {
      throw new Error(config.missingMessageError ?? "Message is not set for signing.")
    }
    await config.ensureReady?.(request)
    const signature = await config.signMessage(address, request.message, request.payload)
    // Cache under the request's payload (e.g. target chainId) — the SAME key the
    // ensure read uses, so the next claim hits the cache instead of re-prompting.
    await setItem(address, signature, request.payload)
    return signature
  })

  const settle = usePersistFn(async (request: SigningOptions<Payload>) => {
    try {
      const signature = await sign(request)
      // Settle outside the render commit. Consume the deferred INSIDE the tick
      // so a cancel landing during the 20ms window wins the race and this
      // becomes a no-op rather than resolving an already-rejected promise.
      await runInNextTick(() => consumeDeferred()?.resolve(signature), 20)
    } catch (error) {
      if (address) {
        await removeItem(address, request.payload)
      }
      // Same once-only guard as the success path; if a cancel already consumed
      // the deferred, this reject is dropped instead of double-settling.
      consumeDeferred()?.reject(error)
    } finally {
      dispatch({ kind: "settled" })
    }
  })

  const onConfirm = usePersistFn(() => {
    const request = stateRef.current.request
    if (!request) return
    dispatch({ kind: "confirm" })
    void settle(request)
  })

  const onCancel = usePersistFn(() => {
    dispatch({ kind: "cancel" })
    // Once-only: if a sign already settled (or is mid-resolve), the deferred is
    // gone and this cancel is a no-op rather than a lost/duplicate rejection.
    consumeDeferred()?.reject(new Error("User canceled"))
  })

  channel.useSubscribe((options) => {
    const request = options ?? {}
    return new Promise<Signature>((resolve, reject) => {
      deferredRef.current = { resolve, reject }
      dispatch({ kind: "prompt", request })
      if (request.skipDialog) {
        // Fast-path: skip the consent surface and sign immediately.
        void settle(request)
      }
    })
  })

  return {
    open: state.phase !== "idle",
    pending: state.phase === "signing",
    content: state.request?.content ?? "",
    onConfirm,
    onCancel,
  }
}
