import { sha256Hex } from "./sha256"

/**
 * [golden-test] sha256 of the raw `tosMessage`, `0x`-prefixed lowercase hex;
 * this is the `{TOS_HASH}` substitution value (mirrors ACS `Extra::tos_message`
 * step). Delegates to `sha256Hex`.
 */
export const buildTosHash = (tosMessage: string): Promise<`0x${string}`> => sha256Hex(tosMessage)

/**
 * [golden-test] Substitutes `{address}` and `{TOS_HASH}` into the
 * `app_conf.extra.tosTemplate` and returns the exact string the user signs.
 *
 * **Receives an already-chain-formatted `address`** — EVM-lowercase vs
 * Solana-base58-verbatim is decided upstream by a chain-discriminated
 * `formatAddressForTemplate` step at the chain ToS leaf (`@repo/chains-*`),
 * NOT here. The builder never sniffs chain (§2.7 correction).
 */
export const buildToSMessage = (
  template: string,
  args: { address: string; tosHash: `0x${string}` },
): string => template.replace("{address}", args.address).replace("{TOS_HASH}", args.tosHash)
