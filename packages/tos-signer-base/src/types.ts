// Pure type contracts for the chain-agnostic ToS signer: per-sign-request
// options, the matched-pair config + matched set, the one payload-aware key
// resolver, the host state shape, the ensure config, and the cache store shape.
// Zero runtime deps; the whole package is parameterized over
// `Address`/`Signature`/`Payload` generics defined here. (The `ToSDialogProps`
// slot contract lives in `dialog/slot.ts`.)

/** One ToS sign request carried over the private channel. */
export interface SigningOptions<Payload = void> {
  /** ToS hash — namespaces the cached signature per ToS version. */
  identifier?: string
  /** Raw ToS markdown rendered by the consent slot. */
  content?: string
  /** The exact message handed to the wallet to sign. */
  message?: string
  /** Skip the consent surface and sign immediately (re-sign / programmatic path). */
  skipDialog?: boolean
  /** Chain-specific extras forwarded to `signMessage` (e.g. EVM target chainId, Solana memo-tx flag). */
  payload?: Payload
}

/**
 * The ONE cache-key resolver shape, payload-aware. Key on payload facts (e.g.
 * the EVM target chainId) rather than live wallet state to avoid chain-switch
 * races. The store consumes exactly this type so it can always see what the host
 * keys on. The key is local-cache-only and never sent to the backend.
 */
export type ResolveStorageKey<Address extends string = string, Payload = void> = (data: {
  address: Address
  identifier: string
  payload?: Payload
}) => Promise<string> | string

/**
 * Chain-specific config passed once to `createToSSigner`; carries no channel
 * string — the channel is a private token minted by the factory.
 */
export interface ToSSignerConfig<
  Address extends string = string,
  Signature extends string = string,
  Payload = void,
> {
  /** localStorage namespace for cached signatures (per-chain, per-version). */
  storagePrefix: string
  /** Chain-specific wallet sign function (EVM EIP-191 personal-sign / Solana Ed25519 or Memo-tx). */
  signMessage: (address: Address, message: string, payload?: Payload) => Promise<Signature>
  /**
   * Lowercase the local cache key (EVM case-insensitivity); `false` keeps
   * Solana base58 verbatim. Local-only, never sent to the backend.
   */
  lowercaseKeys?: boolean
  /** Custom payload-aware cache-key resolver; defaults to address (optionally lowercased). */
  getStorageKey?: ResolveStorageKey<Address, Payload>
  /** Pre-sign readiness hook (e.g. switch wallet to `payload.chainId`). */
  ensureReady?: (options: SigningOptions<Payload>) => Promise<void> | void
  /** Override for the default "no connected wallet" error copy. */
  missingAddressError?: string
  /** Override for the default "no message to sign" error copy. */
  missingMessageError?: string
}

/** The headless host state a consent slot renders; returned by `useToSSignerHost`. */
export interface ToSSignerHostState {
  /** Whether a consent decision is pending (drive the dialog's open). */
  open: boolean
  /** Signing in progress; disable buttons / show "Signing…". */
  pending: boolean
  /** ToS markdown to render in the consent body (defaults to ''). */
  content: string
  /** Accept handler; advances the machine to signing. */
  onConfirm: () => void
  /** Cancel/dismiss handler; rejects the awaiting caller and clears the entry. */
  onCancel: () => void
}

/** The per-call params to `ensureToSSigned`. */
export type EnsureToSSignedParams<Payload = void> = {
  skipDialog?: boolean
  payload?: Payload
}

/**
 * Typed dep bundle for the ensure orchestration; required wiring vs optional
 * template hooks structurally separated.
 */
export interface EnsureToSSignedConfig<
  Address extends string = string,
  Signature extends string = string,
  Payload = void,
> {
  /** Connected wallet address; throws at call time if missing. */
  address: Address | undefined
  /**
   * The matched emitter from the same `createToSSigner` (real `SigningOptions`
   * contract, NO open index signature).
   */
  signToS: (options: SigningOptions<Payload>) => Promise<Signature>
  /**
   * Chain-discriminated `{address}` formatting (EVM lowercase / Solana
   * identity); defaults to identity. The chain decision lives at the leaf,
   * never in the pure builder.
   */
  formatAddressForTemplate?: (address: Address) => string
  /** Chain-specific extras merged into the `signToS` options (e.g. inject `payload.chainId`). */
  getSignExtra?: (params: EnsureToSSignedParams<Payload>) => Partial<SigningOptions<Payload>>
  /** Pre-flight validation invoked before signing (e.g. assert a public client exists). */
  validate?: () => void
  /**
   * Override the ToS-template `appId`; defaults to the ACS public-client config
   * so the hook stays callable in isolation/tests.
   */
  appId?: string
}

/** The ensure orchestrator's return. */
export interface EnsureToSSignedResult<Signature extends string = string, Payload = void> {
  ensureToSSigned: (params?: EnsureToSSignedParams<Payload>) => Promise<Signature>
}

/**
 * The matched wiring the factory pre-binds for the ensure hook: the matched
 * emitter (`signToS`) + the matched store hook (keyed on the live ToS hash so
 * the cache lookup lands in the SAME namespace the host writes to on Accept).
 */
export interface EnsureToSSignedMatched<
  Address extends string = string,
  Signature extends string = string,
  Payload = void,
> {
  signToS: (options: SigningOptions<Payload>) => Promise<Signature>
  useStore: (options: { identifier: string }) => ToSSignatureStore<Address, Signature, Payload>
}

/**
 * The leaf-facing ensure deps: the full ensure config minus the matched
 * `signToS` the factory injects (required `address` + optional template hooks).
 * The single home for the `Omit<EnsureToSSignedConfig, 'signToS'>` shape the
 * factory and the matched-set member both reference.
 */
export type EnsureToSSignedDeps<
  Address extends string = string,
  Signature extends string = string,
  Payload = void,
> = Omit<EnsureToSSignedConfig<Address, Signature, Payload>, "signToS">

/**
 * The local signature cache surface. `payload` is threaded into every accessor so
 * the read (ensure) and write (host) sites derive the SAME key via `getStorageKey`
 * — e.g. the EVM resolver keys on `payload.chainId`, so omitting it on the read
 * side caused a permanent cache miss (re-prompt every claim).
 */
export interface ToSSignatureStore<
  Address extends string = string,
  Signature extends string = string,
  Payload = void,
> {
  /** Read cached signature by resolved (address, payload) key. */
  getItem: (address: Address, payload?: Payload) => Promise<Signature | undefined>
  /** Write a signature under the resolved (address, payload) key. */
  setItem: (address: Address, signature: Signature, payload?: Payload) => Promise<void>
  /** Drop one entry (on cancel/failure). */
  removeItem: (address: Address, payload?: Payload) => Promise<void>
  /** Clear all entries in this prefix. */
  clear: () => void
}

/**
 * The matched set returned by `createToSSigner`; all members share one private
 * channel token by construction.
 */
export interface ToSSigner<
  Address extends string = string,
  Signature extends string = string,
  Payload = void,
> {
  /** Emitter hook; `signToS` publishes on the private token and returns the promise resolved by the host. */
  useSignToS: () => {
    signToS: (options?: SigningOptions<Payload>) => Promise<Signature>
  }
  /** Headless host hook; subscribes to the private token, drives the machine, signs+caches+resolves/rejects. */
  useToSSignerHost: (overrides?: { address?: Address }) => ToSSignerHostState
  /** Orchestration hook pre-wired with this signer's matched `signToS` + store getter. */
  useEnsureToSSigned: (
    deps: EnsureToSSignedDeps<Address, Signature, Payload>,
  ) => EnsureToSSignedResult<Signature, Payload>
  /** The matched local-cache store hook. */
  useToSSignatureStore: (options: {
    identifier: string
  }) => ToSSignatureStore<Address, Signature, Payload>
}
