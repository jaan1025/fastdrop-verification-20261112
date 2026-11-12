// ACS error model — a branded tagged object (NO class; L8/H1) mirroring the Rust
// backend's numeric error codes, plus a constructor + guard + body extractors.
// Replaces the legacy `AcsError extends Error` class. Pure.

/**
 * Numeric error codes returned by the backend in `{ error, code }` payloads.
 * Mirror of `AppErrorCode` in `clique-acs/src/error.rs`. Most non-BadRequest
 * paths collapse to `Unknown = 0`; codes in the 4xxxx range are domain errors
 * worth branching on.
 *
 * Backend may add new codes the SDK doesn't know about — keep `AcsError.code`
 * typed as `number | undefined` and use this object only for known values.
 */
export const AcsErrorCode = {
  Unknown: 0,
  HexDecodeError: 2,
  Base64DecodeError: 3,
  DecimalDecodeError: 4,
  EvmSignatureDecodeError: 5,
  Base58DecodeError: 6,
  SolanaPublicKeyDecodeError: 7,
  SolanaSignatureDecodeError: 8,
  Utf8DecodeError: 9,
  BincodeDecodeError: 10,
  DeploymentAlreadyExists: 40000,
  InvalidAppId: 40001,
  SignatureVerificationFailed: 40002,
  AllocationNotFound: 40003,
  AddressBindingCannotChanged: 40004,
  AllocationIsDeferred: 40005,
  NegativeAmount: 40006,
  AmountTooLarge: 40007,
  InvalidSignature: 40008,
  MigrationVersionMismatch: 40009,
  InvalidPatchOperation: 40010,
  InvalidBatch: 40011,
  InvalidPayload: 40012,
  InvalidHookType: 40013,
  WithdrawRecipientNotConfigured: 40014,
  InvalidResolvedAddress: 40015,
  RpcError: 50001,
  TransactionFailed: 50002,
  ChainIdCastError: 50003,
  MerkleRootNotFound: 50004,
} as const

export type AcsErrorCode = (typeof AcsErrorCode)[keyof typeof AcsErrorCode]

/**
 * The tagged ACS error object (NOT a class). Detect via {@link isAcsError},
 * construct via {@link createAcsError}.
 */
export interface AcsError {
  /** Discriminant brand — the single way to detect an ACS error. */
  readonly kind: "AcsError"
  /** HTTP status (0 for network errors). */
  readonly status: number
  /** HTTP status text. */
  readonly statusText: string
  /** Raw response body. */
  readonly body: unknown
  /** Request URL. */
  readonly url: string
  /** Human-readable message. */
  readonly message: string
  /**
   * Numeric `code` from the backend body (see {@link AcsErrorCode}).
   * `undefined` for non-JSON bodies and network errors.
   */
  readonly code: number | undefined
}

export const createAcsError = (args: {
  status: number
  statusText: string
  body: unknown
  url: string
  message: string
  code?: number
}): AcsError => ({
  kind: "AcsError",
  status: args.status,
  statusText: args.statusText,
  body: args.body,
  url: args.url,
  message: args.message,
  code: args.code,
})

/**
 * The single way apps detect ACS errors in `catch` (replaces
 * `instanceof AcsError`).
 */
export const isAcsError = (x: unknown): x is AcsError =>
  typeof x === "object" && x !== null && (x as { kind?: unknown }).kind === "AcsError"

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value)

/**
 * Extract the `code` field from an error response body. Backend wire format:
 * `{ error: string, code: u64 }`.
 */
export const extractCode = (body: unknown): number | undefined => {
  if (body && typeof body === "object") {
    const candidate = (body as Record<string, unknown>).code
    if (isFiniteNumber(candidate)) return candidate
  }
  return undefined
}

export const extractMessage = (body: unknown, fallback: string): string => {
  if (typeof body === "string" && body.length > 0) return body
  if (body && typeof body === "object") {
    const candidate =
      (body as Record<string, unknown>).message ??
      (body as Record<string, unknown>).error ??
      (body as Record<string, unknown>).reason
    if (typeof candidate === "string" && candidate.length > 0) return candidate
  }
  return fallback
}
