import {
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
  type TransactionMessage,
  type TransactionMessageWithFeePayer,
  type TransactionMessageWithLifetime,
} from "@solana/kit"
import { type ProgramErrorResolver } from "../../errors"

// ---------------------------------------------------------------------------
// Wallet-strategy discriminant + opaque send handle
// ---------------------------------------------------------------------------

/** The two wallet strategies currently supported by the Solana tx pipeline. */
export type SolanaWalletKind = "standard" | "squadsx"

/**
 * Opaque handle returned by `sendTransaction`.
 *
 * - `standard` — the transaction was sent and landed; `signature` is the
 *   on-chain signature. `confirmTransaction` will wait for finality.
 * - `squadsx` — a Squads V4 proposal was created; `proposalSignature` is the
 *   proposal-creation tx signature. `confirmTransaction` will poll for
 *   multisig execution and then confirm the execution tx.
 */
export type SolanaTxHandle =
  { kind: "standard"; signature: string } | { kind: "squadsx"; proposalSignature: string }

// ---------------------------------------------------------------------------
// send / confirm parameter shapes (parallel to the EVM kit's `EvmConfirmContext`)
// ---------------------------------------------------------------------------

export interface SendTransactionParams {
  rpc: Rpc<SolanaRpcApi>
  rpcSubscriptions?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  /**
   * The message must have a blockhash set so it can be compiled for
   * simulation. The actual blockhash used for sending is refreshed inside
   * `sendTransaction` *after* simulation, to maximise the validity window
   * during signing and network propagation.
   */
  txMessage: TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime
  wallet?: { name: string } | null
  /**
   * Optional Clique/other program-error resolver injected at the contracts
   * call site; threaded to `simulate` so on-chain program failures decode to
   * friendly messages instead of raw custom-error codes.
   */
  resolveProgramError?: ProgramErrorResolver
}

export interface ConfirmTransactionContext {
  rpc: Rpc<SolanaRpcApi>
  rpcSubscriptions?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  /** Optional program-error resolver (reserved for future use; not consumed by
   *  the low-level `confirm` which only has null logs at that point). */
  resolveProgramError?: ProgramErrorResolver
}
