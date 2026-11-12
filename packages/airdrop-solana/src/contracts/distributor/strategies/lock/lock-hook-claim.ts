import {
  type Address,
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
  type TransactionSigner,
  appendTransactionMessageInstructions,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit"
import type { UiWallet } from "@wallet-standard/react"
import { findAssociatedTokenPda } from "@solana-program/token"
import { TOKEN_2022_PROGRAM_ADDRESS } from "@solana-program/token-2022"
import { getMintTokenProgram } from "@repo/chain-solana-kit/token"
import { type SolanaTxHandle } from "@repo/chain-solana-kit/transaction"
import { hexToBytes } from "@repo/shared/utils"
import { sendTransaction } from "../../../../transaction/send"
import { getDistributorPDA } from "../../functions/pda"
import { getStreamPDA, getNftBindingPDA } from "../../../lock/functions/pda"
import { fetchStream, fetchNftBinding, isNftBoundStream } from "../../../lock/functions/fetch"
import { deriveStreamId } from "./stream-id"
import { buildClaimLockedInstructions } from "../../../lock/functions/build-claim"

/**
 * Lock-hook claim PRIMITIVE — the subsequent clique-lock claim that forwards an
 * existing stream's vested portion to the stored recipient. Symmetric with the
 * EVM `lockHookClaim`: it is the on-chain submit given fully-resolved
 * inputs (base / root / recipient). NO preflight (the consumer hook calls the
 * kit preflight first), NO ACS data acquisition.
 *
 * The stream is keyed off the recipient — NOT the connected wallet. The stream
 * was created with streamId = keccak256(distributor || root || recipient) on the
 * initial claim, and its vested tokens must return to the recipient. The
 * connected wallet is only the payer/signer, so an admin can trigger the claim
 * on the recipient's behalf.
 */
export interface LockHookClaimContext {
  rpc: Rpc<SolanaRpcApi>
  ws?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  wallet: UiWallet | null
  payer: TransactionSigner
  base: Address
  root: `0x${string}`
  /**
   * Allocation recipient — the on-chain claimer the stream is keyed to. Tokens
   * return to its ATA.
   */
  recipient: Address
}

export const lockHookClaim = async (ctx: LockHookClaimContext): Promise<SolanaTxHandle> => {
  const { rpc, ws, wallet, payer, base, root, recipient } = ctx
  if (!payer) throw new Error("Wallet is not connected")
  if (!base) throw new Error("Base address is not available")
  if (!root) throw new Error("Root is not available")
  if (!recipient) throw new Error("Recipient is not available")

  const rootBytes = hexToBytes(root)

  const [distributorPda] = await getDistributorPDA(base)

  const streamId = deriveStreamId({
    distributorPda,
    root: rootBytes,
    claimer: recipient,
  })

  const [streamPda] = await getStreamPDA(streamId)
  const [nftBindingPda] = await getNftBindingPDA(streamId)

  const stream = await fetchStream(rpc, streamPda)
  if (!stream) throw new Error("Stream not found")

  const { mint } = stream
  const tokenProgram = await getMintTokenProgram(rpc, mint)

  let nftBinding = null
  let nftHolderTokenAccount: Address | undefined

  if (isNftBoundStream(stream)) {
    nftBinding = await fetchNftBinding(rpc, nftBindingPda)
    if (!nftBinding) {
      throw new Error("NFT binding not found for NFT-bound stream")
    }

    const [nftAta] = await findAssociatedTokenPda({
      mint: nftBinding.nftMint,
      owner: recipient,
      tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
    })
    nftHolderTokenAccount = nftAta
  }

  const { instructions } = await buildClaimLockedInstructions({
    rpc,
    payer,
    claimer: recipient,
    streamId,
    stream,
    streamPda,
    tokenProgram,
    nftBinding: nftBinding ?? undefined,
    nftBindingPda: isNftBoundStream(stream) ? nftBindingPda : undefined,
    nftHolderTokenAccount,
  })

  const latestBlockhash = (await rpc.getLatestBlockhash().send()).value

  const txMessage = appendTransactionMessageInstructions(
    instructions,
    setTransactionMessageLifetimeUsingBlockhash(
      latestBlockhash,
      setTransactionMessageFeePayerSigner(payer, createTransactionMessage({ version: 0 })),
    ),
  )

  return sendTransaction({
    rpc,
    rpcSubscriptions: ws,
    txMessage,
    wallet,
  })
}
