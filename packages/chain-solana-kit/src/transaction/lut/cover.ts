/**
 * Project-level LUT provisioning — create or expand a shared Address Lookup Table
 * to cover a fixed set of accounts, plus the read-only diff/preview. A project LUT
 * can exceed what one transaction carries, so the extends are sent across MULTIPLE
 * transactions.
 */
import {
  type Address,
  type Rpc,
  type SolanaRpcApi,
  type TransactionSigner,
  type RpcSubscriptions,
  type SolanaRpcSubscriptionsApi,
  appendTransactionMessageInstructions,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit"
import {
  getCreateLookupTableInstructionAsync,
  getExtendLookupTableInstruction,
} from "@solana-program/address-lookup-table"
import { walletTx } from "../wallet-tx"
import { diffLutAddresses } from "./diff"
import { fetchLut, waitForLutActive } from "./table"
import { LUT_MAX_ADDRESSES, ADDRESSES_PER_EXTEND } from "./limits"

/**
 * The LUT's current addresses (empty when there's no LUT yet) and the `toAdd`
 * diff against `desired` — the one shared read behind both `previewLutCoverage`
 * (which reports the diff) and `ensureLutCovers` (which applies it). No
 * `lutAddress` ⇒ no fetch, since nothing exists to read.
 */
const resolveLutDiff = async (
  rpc: Rpc<SolanaRpcApi>,
  lutAddress: Address | undefined,
  desired: Address[],
): Promise<{ existing: Address[]; toAdd: Address[] }> => {
  const existing = lutAddress ? [...(await fetchLut(rpc, lutAddress)).addresses] : []
  return { existing, toAdd: diffLutAddresses(existing, desired) }
}

const assertLutCapacity = (total: number): void => {
  if (total > LUT_MAX_ADDRESSES) {
    throw new Error(
      `Address lookup table would hold ${total} addresses, over the ${LUT_MAX_ADDRESSES} limit. ` +
        "Split the project across multiple LUTs.",
    )
  }
}

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

const sendLutTx = async (
  params: Pick<EnsureLutCoversParams, "rpc" | "rpcSubscriptions" | "payer" | "wallet">,
  instructions: Parameters<typeof appendTransactionMessageInstructions>[0],
): Promise<void> => {
  const { value: latestBlockhash } = await params.rpc.getLatestBlockhash().send()
  const txMessage = appendTransactionMessageInstructions(
    instructions,
    setTransactionMessageLifetimeUsingBlockhash(
      latestBlockhash,
      setTransactionMessageFeePayerSigner(params.payer, createTransactionMessage({ version: 0 })),
    ),
  )
  await walletTx.sendAndConfirm({
    rpc: params.rpc,
    rpcSubscriptions: params.rpcSubscriptions,
    txMessage,
    wallet: params.wallet,
  })
}

export interface EnsureLutCoversParams {
  rpc: Rpc<SolanaRpcApi>
  rpcSubscriptions?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  payer: TransactionSigner
  wallet?: { name: string } | null
  /** Existing project LUT; when omitted a fresh LUT is created. */
  lutAddress?: Address
  /** The full set the LUT should cover. */
  addresses: Address[]
}

export interface EnsureLutCoversResult {
  lutAddress: Address
  /** Addresses actually appended this run (empty when already covered). */
  added: Address[]
}

/**
 * Idempotently make a project LUT cover `addresses`. Create-or-extend: with no
 * `lutAddress` a fresh LUT is created; with one, only the missing addresses are
 * appended (empty diff → no-op, no tx). A project LUT can exceed what a single tx
 * carries, so the extends are sent across MULTIPLE txs (`ADDRESSES_PER_EXTEND`
 * each). Throws if the table would exceed the 256-address cap.
 *
 * For a multisig (Squads) authority each tx is its own proposal — expected, and
 * the whole point: the resulting shared LUT is what later lets multisig claims
 * fit without on-the-fly creation.
 */
export const ensureLutCovers = async (
  params: EnsureLutCoversParams,
): Promise<EnsureLutCoversResult> => {
  const { rpc, rpcSubscriptions, payer, wallet, lutAddress, addresses } = params
  const send = { rpc, rpcSubscriptions, payer, wallet }

  const { existing, toAdd } = await resolveLutDiff(rpc, lutAddress, addresses)

  // An existing LUT that already covers everything → no tx.
  if (lutAddress && toAdd.length === 0) return { lutAddress, added: [] }
  assertLutCapacity(existing.length + toAdd.length)

  // Extend an existing LUT with just the diff.
  if (lutAddress) {
    for (const part of chunk(toAdd, ADDRESSES_PER_EXTEND)) {
      await sendLutTx(send, [
        getExtendLookupTableInstruction({
          address: lutAddress,
          authority: payer,
          payer,
          addresses: part,
        }),
      ])
    }
    await waitForLutActive(rpc, lutAddress)
    return { lutAddress, added: toAdd }
  }

  // Create a fresh LUT. The first tx carries the create ix + first chunk; the
  // remaining chunks follow in their own txs (each references the now-created LUT).
  const slot = await rpc.getSlot().send()
  const createInstruction = await getCreateLookupTableInstructionAsync({
    authority: payer.address,
    payer,
    recentSlot: slot,
  })
  const newLutAddress = createInstruction.accounts[0].address as Address

  const [firstChunk = [], ...restChunks] = chunk(toAdd, ADDRESSES_PER_EXTEND)
  await sendLutTx(send, [
    createInstruction,
    ...(firstChunk.length
      ? [
          getExtendLookupTableInstruction({
            address: newLutAddress,
            authority: payer,
            payer,
            addresses: firstChunk,
          }),
        ]
      : []),
  ])
  for (const part of restChunks) {
    await sendLutTx(send, [
      getExtendLookupTableInstruction({
        address: newLutAddress,
        authority: payer,
        payer,
        addresses: part,
      }),
    ])
  }

  await waitForLutActive(rpc, newLutAddress)
  return { lutAddress: newLutAddress, added: toAdd }
}

export interface PreviewLutCoverageResult {
  /** Whether a LUT already exists (vs. a fresh create being needed). */
  hasLut: boolean
  /** Addresses that WOULD be appended — empty ⇒ already up to date. */
  missing: Address[]
}

/**
 * Read-only counterpart to `ensureLutCovers`: what a provision run WOULD add,
 * without sending any transaction. No `lutAddress` ⇒ everything is missing (a
 * fresh create). Powers the "check for new accounts" affordance.
 */
export const previewLutCoverage = async ({
  rpc,
  lutAddress,
  addresses,
}: {
  rpc: Rpc<SolanaRpcApi>
  lutAddress?: Address
  addresses: Address[]
}): Promise<PreviewLutCoverageResult> => {
  const { toAdd } = await resolveLutDiff(rpc, lutAddress, addresses)
  return { hasLut: !!lutAddress, missing: toAdd }
}
