import {
  type Abi,
  decodeFunctionData,
  decodeErrorResult,
  ContractFunctionRevertedError,
} from "viem"
import { type ErrorAbis } from "./abis"

// ---------------------------------------------------------------------------
// Decode — extract STRUCTURED error info from raw viem errors / calldata.
// No message-building (that's `format.ts`) and no RPC. Parallel layer to the
// Solana kit's `errors/decode.ts` (which parses logs / error codes).
// ---------------------------------------------------------------------------

export interface DecodedErrorResult {
  errorName: string
  args: readonly unknown[]
}

const findEncodedErrorData = (message: string): `0x${string}` | undefined => {
  // Match ONLY a selector-aligned blob: 0x + a 4-byte selector (8 hex) followed
  // by zero or more 32-byte ABI words, not run into more hex. This excludes bare
  // 20-byte addresses (40 hex) and 32-byte hashes (64 hex) that viem routinely
  // embeds in messages — they are not 8+64n aligned and so won't be mis-decoded.
  const hexMatch = message.match(/0x(?:[a-fA-F0-9]{8})(?:[a-fA-F0-9]{64})*(?![a-fA-F0-9])/)
  return hexMatch ? (hexMatch[0] as `0x${string}`) : undefined
}

const decodeKnownError = (
  errorData: `0x${string}`,
  errorAbis: ErrorAbis,
): DecodedErrorResult | undefined => {
  for (const abi of errorAbis) {
    try {
      const decoded = decodeErrorResult({ abi, data: errorData })
      return { errorName: decoded.errorName, args: decoded.args ?? [] }
    } catch {
      continue
    }
  }
  return undefined
}

/**
 * Decode a viem `ContractFunctionRevertedError` into structured
 * `{ errorName, args }`, or `undefined`. Tries, in order: viem's own decode →
 * the raw revert bytes against every ABI in `errorAbis` → a selector scraped
 * from the error message.
 */
export const decodeRevertErrorResult = (
  revertError: ContractFunctionRevertedError,
  errorAbis: ErrorAbis,
): DecodedErrorResult | undefined => {
  // Best case: viem already decoded the error against the called contract's own
  // ABI (e.g. the distributor's `InvalidFeeConfig`).
  const errorName = revertError.data?.errorName
  if (errorName) {
    return { errorName, args: revertError.data?.args ?? [] }
  }

  // Cross-contract revert: the error is defined on a contract reached via an
  // internal call (e.g. `CliqueLock.StreamConsumed` bubbling up through a
  // LockHook `claim`), so it isn't on the called contract's ABI — viem leaves
  // `data` undecoded and exposes only `raw` + a 4-byte `signature`. `raw` holds
  // the full revert bytes, so decode it against every ABI in the list.
  if (revertError.raw && revertError.raw !== "0x") {
    const decodedFromRaw = decodeKnownError(revertError.raw, errorAbis)
    if (decodedFromRaw) {
      return decodedFromRaw
    }
  }

  // Last resort: scrape selector-aligned error data out of the message string —
  // covers nested causes / older viem paths that don't surface `raw`.
  const encodedFromMessage = findEncodedErrorData(
    revertError.shortMessage || revertError.message || "",
  )
  if (encodedFromMessage) {
    const decodedFromMessage = decodeKnownError(encodedFromMessage, errorAbis)
    if (decodedFromMessage) {
      return decodedFromMessage
    }
  }

  return undefined
}

/** Decode tx calldata into its function name + args (swallows on mismatch). */
export const decodeInputData = (input: `0x${string}`, abi: Abi) => {
  try {
    const result = decodeFunctionData({ abi, data: input })
    return { functionName: result.functionName, args: result.args }
  } catch {
    return { functionName: undefined, args: [] as readonly unknown[] }
  }
}

/** Pick the ABI from `errorAbis` whose function the calldata decodes against. */
export const findMatchingAbiForInput = (
  input: `0x${string}`,
  errorAbis: ErrorAbis,
): Abi | undefined => {
  for (const candidate of errorAbis) {
    try {
      const decoded = decodeFunctionData({ abi: candidate, data: input })
      if (decoded?.functionName) return candidate
    } catch {
      // try next candidate
    }
  }
  return undefined
}
