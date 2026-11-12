import { type SolanaWalletKind } from "./types"
import { isSquadsXWallet } from "./squadsx"

/**
 * Generic "is this a slow multisig?" predicate. Wallets whose signing flow is
 * too slow to create an Address Lookup Table on the fly — the ALT program
 * checks `recent_slot` against SlotHashes (~3.4 min window), which a Squads
 * propose-approve-execute cycle can never land inside — must rely on a
 * pre-existing (shared / cached) LUT instead of driving on-chain LUT creation
 * (see `transaction/lut/`).
 *
 * Lives at the dispatcher level, NOT in `squadsx/`, because it is a generic
 * capability constraint — not a Squads-specific mechanism. Currently SquadsX is
 * the only qualifying multisig, so it delegates; new multisigs would OR in here.
 */
export const isMultisigWallet = (wallet?: { name: string } | null): boolean =>
  isSquadsXWallet(wallet)

/**
 * Classify the connected Solana wallet into a tx-strategy kind. Composes the
 * SquadsX-specific predicate in `squadsx/primitives/detect.ts`; the `send` dispatcher
 * switches exhaustively on the returned kind (parallel to EVM
 * `detectEvmWalletKind`).
 */
export const detectSolanaWalletKind = (wallet?: { name: string } | null): SolanaWalletKind =>
  isSquadsXWallet(wallet) ? "squadsx" : "standard"
