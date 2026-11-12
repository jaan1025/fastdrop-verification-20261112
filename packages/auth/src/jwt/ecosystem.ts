import { ecosystemForAlg, type ChainEcosystem } from "./grammar"
import { decodeJwt } from "./parse"

// Recovers the signing ecosystem from a token's header `alg` — the single source of
// truth for "which chain signed in" (aligns with the ACS classification-point rule;
// downstream wallet UI keys off this, never ad-hoc address sniffing). Decodes the
// header, maps `alg` back to its ecosystem via `ecosystemForAlg` (`ETHEREUM`→evm,
// `ED25519`→solana); null when malformed/absent/unknown alg.
export const jwtEcosystem = (token: string): ChainEcosystem | null => {
  const alg = decodeJwt(token)?.header.alg
  return alg ? ecosystemForAlg(alg) : null
}
