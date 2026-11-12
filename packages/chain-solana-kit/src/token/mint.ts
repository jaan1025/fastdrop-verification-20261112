import { unwrapOption } from "@solana/kit"
import { type Mint as TokenMint } from "@solana-program/token"
import { type Mint as Token2022Mint } from "@solana-program/token-2022"
import type { TokenMetadata } from "./metadata"

/** A decoded SPL or Token-2022 mint account. */
export type MintInfo = TokenMint | Token2022Mint

/**
 * Extract the Token-2022 `TokenMetadata` extension from a decoded mint, when
 * present. Returns `null` for classic SPL mints or Token-2022 mints that
 * haven't installed the metadata extension.
 *
 * Token-2022's metadata extension stores name/symbol/uri *inline* on the mint
 * account, so consumers should prefer this over a separate Metaplex PDA
 * lookup when both happen to exist.
 */
export const extractEmbeddedTokenMetadata = (mint: MintInfo): TokenMetadata | null => {
  // Classic SPL Token mints have no `extensions` field at all.
  const extensionsField = (mint as Token2022Mint).extensions
  if (!extensionsField) return null
  const extensions = unwrapOption(extensionsField)
  if (!extensions) return null
  const metaExt = extensions.find((ext) => ext.__kind === "TokenMetadata")
  if (!metaExt || metaExt.__kind !== "TokenMetadata") return null
  return {
    mint: metaExt.mint,
    name: metaExt.name,
    symbol: metaExt.symbol,
    uri: metaExt.uri,
  }
}
