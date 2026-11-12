import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { fetchAndDecodeAccount } from "@repo/chain-solana-kit/utils"
import { STREAM_DISCRIMINATOR, getStreamDecoder, type Stream } from "../generated/accounts/stream"
import {
  NFT_BINDING_DISCRIMINATOR,
  getNftBindingDecoder,
  type NftBinding,
} from "../generated/accounts/nftBinding"

// Re-export the generated account types from the hand facade so hooks import
// `Stream`/`NftBinding` from here, not from `generated/` (analysis L4 — the type
// re-export home is the fetch leaf after the god-file split).
export type { Stream, NftBinding }

/** Fetch + discriminator-checked decode of a clique-lock Stream account. */
export const fetchStream = async (
  rpc: Rpc<SolanaRpcApi>,
  address: Address,
): Promise<Stream | null> =>
  fetchAndDecodeAccount({
    rpc,
    address,
    expectedDiscriminator: STREAM_DISCRIMINATOR,
    decode: getStreamDecoder().decode,
  })

/** Fetch + discriminator-checked decode of a clique-lock NftBinding account. */
export const fetchNftBinding = async (
  rpc: Rpc<SolanaRpcApi>,
  address: Address,
): Promise<NftBinding | null> =>
  fetchAndDecodeAccount({
    rpc,
    address,
    expectedDiscriminator: NFT_BINDING_DISCRIMINATOR,
    decode: getNftBindingDecoder().decode,
  })

/**
 * A stream is NFT-bound when its `recipient` is the default (all-zero) pubkey —
 * the real recipient is resolved from the NftBinding at claim time.
 */
export const isNftBoundStream = (stream: Stream): boolean =>
  stream.recipient === "11111111111111111111111111111111"
