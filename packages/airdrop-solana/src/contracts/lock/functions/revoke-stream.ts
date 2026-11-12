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
import { getMintTokenProgram } from "@repo/chain-solana-kit/token"
import { type SolanaTxHandle } from "@repo/chain-solana-kit/transaction"
import { sendTransaction } from "../../../transaction/send"
import { buildRevokeStreamInstructions } from "./build-revoke"
import { fetchStream, isNftBoundStream } from "./fetch"
import { getStreamPDA, getNftBindingPDA } from "./pda"

/**
 * Revoke-stream PRIMITIVE — clawback of a clique-lock stream's unclaimed portion
 * back to the revoke authority. Symmetric with `lockHookClaim`: it is the
 * on-chain submit given a resolved streamId. NO ACS data acquisition; the
 * connected wallet is the revoke authority (payer/signer).
 */
export interface RevokeStreamContext {
  rpc: Rpc<SolanaRpcApi> | undefined
  ws?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  wallet: UiWallet | null
  /** Connected wallet account address — gates the connected-wallet precondition. */
  account: Address | undefined
  /** Caller-injected signer; tokens return to this authority's ATA. */
  revokeAuthority: TransactionSigner | null
  /** 32-byte stream identifier — output of `deriveStreamId` on the merkle root + recipient. */
  streamId: Uint8Array
}

export const revokeStream = async (ctx: RevokeStreamContext): Promise<SolanaTxHandle> => {
  const { rpc, ws, wallet, account, revokeAuthority, streamId } = ctx
  if (!rpc) throw new Error("Solana rpc not ready")
  if (!revokeAuthority) throw new Error("Wallet is not connected")
  if (!account) throw new Error("Wallet is not connected")

  const [streamPda] = await getStreamPDA(streamId)
  const stream = await fetchStream(rpc, streamPda)
  if (!stream) throw new Error("Stream not found on-chain")

  const tokenProgram = await getMintTokenProgram(rpc, stream.mint)

  let nftBindingPda: Address | undefined
  if (isNftBoundStream(stream)) {
    ;[nftBindingPda] = await getNftBindingPDA(streamId)
  }

  const { instructions } = await buildRevokeStreamInstructions({
    rpc,
    revokeAuthority,
    streamId,
    stream,
    streamPda,
    tokenProgram,
    nftBindingPda,
  })

  const latestBlockhash = (await rpc.getLatestBlockhash().send()).value
  const txMessage = appendTransactionMessageInstructions(
    instructions,
    setTransactionMessageLifetimeUsingBlockhash(
      latestBlockhash,
      setTransactionMessageFeePayerSigner(
        revokeAuthority,
        createTransactionMessage({ version: 0 }),
      ),
    ),
  )

  return sendTransaction({
    rpc,
    rpcSubscriptions: ws,
    txMessage,
    wallet,
  })
}
