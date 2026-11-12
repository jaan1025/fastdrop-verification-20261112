import { keccak256, toHex, concat, type Hex } from "viem"
import bs58 from "bs58"

/**
 * 4-byte prefix identifying the wire format of a commit-reveal signature.
 * The backend's signature verifier dispatches on this prefix.
 */
export const MEMO_SIG_PREFIX = {
  DEFAULT: new Uint8Array([0xff, 0xff, 0xff, 0xfe]),
} as const

export interface SignMessageWithCommitRevealParams {
  /** 4-byte prefix identifying the signature type. Defaults to MEMO_SIG_PREFIX.DEFAULT */
  prefix?: Uint8Array
  message: string
  /** Sends a memo tx with the commitment as content, returns base58 tx signature */
  sendMemoTx: (commitment: Hex) => Promise<string>
}

/**
 * [golden-test] Computes commitment = keccak256(R || keccak256(M)).
 *
 * The commitment binds the random nonce R to the message M.
 * Only the commitment goes on-chain — R stays local until the signature
 * is submitted to the backend.
 */
export const computeCommitment = (R: Uint8Array, message: string): Hex => {
  const messageHash = keccak256(toHex(new TextEncoder().encode(message)))
  return keccak256(concat([toHex(R), messageHash]))
}

/**
 * [golden-test] Assemble the 100-byte commit-reveal wire signature:
 * `prefix(4) ‖ R(32) ‖ T(64)`, hex-encoded. `T` is the decoded base58 memo-tx
 * signature. The byte layout is what the backend's verifier dispatches on.
 */
export const assembleCommitRevealSignature = (params: {
  prefix: Uint8Array
  R: Uint8Array
  txSignature: string
}): string => {
  const T = bs58.decode(params.txSignature)
  const signatureBytes = new Uint8Array(100)
  signatureBytes.set(params.prefix, 0)
  signatureBytes.set(params.R, 4)
  signatureBytes.set(T, 36)
  return toHex(signatureBytes)
}

/**
 * Sign a message using the commit-reveal scheme.
 *
 * Flow:
 *  1. Generate random R (32 bytes)
 *  2. Compute commitment = keccak256(R || keccak256(M))
 *  3. Send memo tx with commitment via caller-provided transport
 *  4. Construct signature: prefix(4) || R(32) || T(64) = 100 bytes
 *
 * The transport (how the memo tx is sent and confirmed) is injected via
 * `sendMemoTx`. This lets the same scheme work with multisig wallets
 * (SquadsX), MPC wallets, or any wallet that can send on-chain memo txs.
 *
 * @returns Hex-encoded 100-byte signature string
 */
export const signMessageWithCommitReveal = async (
  params: SignMessageWithCommitRevealParams,
): Promise<string> => {
  const { prefix = MEMO_SIG_PREFIX.DEFAULT, message, sendMemoTx } = params

  const R = crypto.getRandomValues(new Uint8Array(32))
  const commitment = computeCommitment(R, message)
  const txSignature = await sendMemoTx(commitment)

  return assembleCommitRevealSignature({ prefix, R, txSignature })
}
