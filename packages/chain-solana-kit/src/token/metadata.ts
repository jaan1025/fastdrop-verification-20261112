import {
  address,
  getAddressEncoder,
  getProgramDerivedAddress,
  type Address,
  type Rpc,
  type SolanaRpcApi,
} from "@solana/kit"

// Metaplex Token Metadata program — same address across mainnet/devnet/testnet.
// https://developers.metaplex.com/token-metadata
export const TOKEN_METADATA_PROGRAM_ADDRESS: Address = address(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
)

export interface TokenMetadata {
  /** The mint this metadata belongs to. */
  mint: Address
  /** Human-readable name (trimmed of trailing null bytes). */
  name: string
  /** Ticker symbol. */
  symbol: string
  /** Off-chain JSON URI (often hosted on Arweave / IPFS / S3). */
  uri: string
}

const textEncoder = new TextEncoder()
const decoder = new TextDecoder("utf-8")

/**
 * Derive the Metaplex Token Metadata PDA for a given mint.
 * Seeds: `["metadata", TOKEN_METADATA_PROGRAM_ADDRESS, mint]`.
 */
export const deriveMetadataPda = async (mint: Address): Promise<Address> => {
  const addressEncoder = getAddressEncoder()
  const [pda] = await getProgramDerivedAddress({
    programAddress: TOKEN_METADATA_PROGRAM_ADDRESS,
    seeds: [
      textEncoder.encode("metadata"),
      addressEncoder.encode(TOKEN_METADATA_PROGRAM_ADDRESS),
      addressEncoder.encode(mint),
    ],
  })
  return pda
}

const trimNulls = (s: string): string => s.replace(/\0+$/, "").trim()

const readU32LE = (data: Uint8Array, offset: number): number =>
  data[offset]! | (data[offset + 1]! << 8) | (data[offset + 2]! << 16) | (data[offset + 3]! << 24)

/**
 * Decode the Metaplex Metadata account body. Borsh-style layout:
 * `key(u8) ‖ updateAuthority(32) ‖ mint(32) ‖ name(str≤32) ‖ symbol(str≤10) ‖
 * uri(str≤200) ‖ …`. We advance by the declared logical length per Borsh and
 * defensively trim trailing null bytes.
 */
export const decodeMetaplexMetadata = (data: Uint8Array, mint: Address): TokenMetadata => {
  let offset = 1 + 32 + 32 // skip key + updateAuthority + mint

  const nameLen = readU32LE(data, offset)
  offset += 4
  const name = trimNulls(decoder.decode(data.subarray(offset, offset + nameLen)))
  offset += nameLen

  const symbolLen = readU32LE(data, offset)
  offset += 4
  const symbol = trimNulls(decoder.decode(data.subarray(offset, offset + symbolLen)))
  offset += symbolLen

  const uriLen = readU32LE(data, offset)
  offset += 4
  const uri = trimNulls(decoder.decode(data.subarray(offset, offset + uriLen)))

  return { mint, name, symbol, uri }
}

/**
 * Fetch the Metaplex Token Metadata account for a mint. Returns `null` when the
 * mint has no metadata account (plain SPL tokens often don't).
 */
export const fetchTokenMetadata = async (
  rpc: Rpc<SolanaRpcApi>,
  mint: Address,
): Promise<TokenMetadata | null> => {
  const pda = await deriveMetadataPda(mint)
  const account = await rpc
    .getAccountInfo(pda, { commitment: "confirmed", encoding: "base64" })
    .send()
  const value = account?.value
  if (!value?.data) return null
  const [base64] = value.data as readonly [string, string]
  const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  if (raw.length < 1 + 32 + 32 + 4) return null
  return decodeMetaplexMetadata(raw, mint)
}
