import type {
  Transaction,
  FullySignedTransaction,
  TransactionWithinSizeLimit,
  TransactionWithLifetime,
} from "@solana/kit"

/**
 * A fully-signed, size-checked, lifetime-bearing transaction — i.e. ready to
 * send. Produced by the signing step, consumed by `./send-and-confirm` and
 * `./squads`. Kept here (a leaf with no value imports) so the tx modules form a
 * DAG: both importers depend on this type without depending on each other.
 */
export type SendableTransaction = Transaction &
  FullySignedTransaction &
  TransactionWithinSizeLimit &
  TransactionWithLifetime
