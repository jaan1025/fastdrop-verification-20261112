/**
 * `ensureTxFits` — compress a transaction under the Solana size limit using LUTs,
 * creating a per-user extra LUT only when allowed and needed.
 *
 * Multisig wallets can't create a LUT on the fly: the ALT program checks
 * `recent_slot` (~3.4 min window) which a Squads propose-approve-execute cycle
 * never lands inside. `ensureTxFits` short-circuits on them with an actionable
 * error and uses only the provided (shared / cached) LUTs.
 */
import {
  AccountRole,
  type Address,
  type AddressesByLookupTableAddress,
  type TransactionMessage,
  type Rpc,
  type SolanaRpcApi,
  type TransactionMessageWithFeePayer,
  type TransactionSigner,
  type RpcSubscriptions,
  type SolanaRpcSubscriptionsApi,
  compressTransactionMessageUsingAddressLookupTables,
  isTransactionMessageWithinSizeLimit,
} from "@solana/kit"
import { logger } from "../../utils/logger"
import { isMultisigWallet } from "../wallet-tx/detect"
import { fetchLut } from "./table"
import { ensureLutCovers } from "./cover"

const isSigner = (role: AccountRole) =>
  role === AccountRole.READONLY_SIGNER || role === AccountRole.WRITABLE_SIGNER

/**
 * Extract all unique non-signer addresses from a transaction message's instructions.
 * Signers cannot be compressed via LUT — they must remain in the static accounts section.
 */
const extractCompressibleAddresses = (message: TransactionMessage): Address[] => {
  const addresses = new Set<Address>()
  for (const ix of message.instructions) {
    addresses.add(ix.programAddress)
    if (ix.accounts) {
      for (const account of ix.accounts) {
        if (!isSigner(account.role)) {
          addresses.add(account.address)
        }
      }
    }
  }
  return [...addresses]
}

export interface EnsureTxFitsParams<
  TMessage extends Exclude<TransactionMessage, { version: "legacy" }> &
    TransactionMessageWithFeePayer,
> {
  baseMessage: TMessage
  rpc: Rpc<SolanaRpcApi>
  rpcSubscriptions?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  payer: TransactionSigner
  wallet?: { name: string } | null
  /** Pre-existing LUT addresses to apply before the size check. */
  lutAddresses?: Address[]
  /** Set false to use only pre-existing LUTs. Defaults to true. */
  allowCreateLut?: boolean
}

export interface EnsureTxFitsResult<TMessage> {
  txMessage: TMessage
  /** Address of the newly created extra LUT, if one was created. */
  extraLutAddress?: Address
}

export const ensureTxFits = async <
  TMessage extends Exclude<TransactionMessage, { version: "legacy" }> &
    TransactionMessageWithFeePayer,
>(
  params: EnsureTxFitsParams<TMessage>,
): Promise<EnsureTxFitsResult<TMessage>> => {
  const {
    baseMessage,
    rpc,
    rpcSubscriptions,
    payer,
    wallet,
    lutAddresses = [],
    allowCreateLut = true,
  } = params

  // Step 1: Fetch and apply all provided LUTs (parallel)
  const lutMap: AddressesByLookupTableAddress = {}
  const coveredAddresses = new Set<Address>()

  const luts = await Promise.all(lutAddresses.map((addr) => fetchLut(rpc, addr)))
  for (let i = 0; i < lutAddresses.length; i++) {
    const addresses = [...luts[i]!.addresses]
    lutMap[lutAddresses[i]!] = addresses
    for (const addr of addresses) {
      coveredAddresses.add(addr)
    }
  }

  let txMessage = lutAddresses.length
    ? (compressTransactionMessageUsingAddressLookupTables(
        baseMessage,
        lutMap,
      ) as typeof baseMessage)
    : baseMessage

  // Step 2: If the provided LUTs already make it fit, we're done.
  if (isTransactionMessageWithinSizeLimit(txMessage)) {
    return { txMessage }
  }

  // Step 3: Multisig wallets can't create a LUT on the fly — the ALT
  // `recent_slot` window (~3.4 min) can't survive a Squads propose-approve-
  // execute cycle. Fail fast with actionable guidance rather than driving a
  // proposal that is guaranteed to expire on chain; only the provided
  // (shared / cached) LUTs are usable for such wallets.
  if (isMultisigWallet(wallet)) {
    throw new Error(
      "Transaction exceeds the Solana size limit and a multisig wallet " +
        "cannot create an address lookup table on the fly. Please ask the " +
        "project to provide a shared LUT covering the required accounts.",
    )
  }

  if (!allowCreateLut) {
    throw new Error(
      "Transaction exceeds the Solana size limit with the available address lookup tables. " +
        "Please ask the project to provide a shared address lookup table covering the required accounts.",
    )
  }

  // Step 4: Create a fresh per-user LUT covering the uncovered addresses.
  const uncoveredAddresses = extractCompressibleAddresses(baseMessage).filter(
    (addr) => !coveredAddresses.has(addr),
  )
  if (!uncoveredAddresses.length) {
    // All compressible addresses already covered but the tx is still too
    // big — the instruction data itself is too large.
    throw new Error(
      "Transaction exceeds size limit but all compressible addresses are " +
        "already covered — the instruction data itself is too large.",
    )
  }

  logger.warn("[ensureTxFits] Creating extra LUT", {
    addressCount: uncoveredAddresses.length,
  })

  // `ensureLutCovers` creates the LUT (splitting across txs if the uncovered set
  // is large) and waits for it to activate — a superset of the old single-tx
  // create, so the per-user path is no longer capped at one extend chunk.
  const { lutAddress: extraLutAddress } = await ensureLutCovers({
    rpc,
    rpcSubscriptions,
    payer,
    wallet,
    addresses: uncoveredAddresses,
  })

  // Step 5: Compress with all LUTs (from scratch)
  const extraLut = await fetchLut(rpc, extraLutAddress)
  lutMap[extraLutAddress] = [...extraLut.addresses]
  txMessage = compressTransactionMessageUsingAddressLookupTables(
    baseMessage,
    lutMap,
  ) as typeof baseMessage

  // Step 6: Final size check
  if (!isTransactionMessageWithinSizeLimit(txMessage)) {
    throw new Error("Transaction exceeds size limit even with all LUTs applied")
  }

  return { txMessage, extraLutAddress }
}
