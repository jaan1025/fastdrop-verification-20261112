// Single source of truth for the JWT chain grammar: the
// `ChainEcosystem → { alg, canonicalizeIssuer }` descriptor table. `ChainEcosystem`
// and the `JwtAlg` union are *derived* from this table so adding a chain ecosystem
// is one entry (L3, P4/P5). This file owns the JWT-grammar arm of the
// EVM-`iss`/`aud` lowercasing contract (Solana base58 untouched).
//
// Tier 0: it cannot import acs-client's `normalizeEvmAddress` (that lives one tier
// above). The EVM-format gate is kept local (mirrors acs-client `isEvmAddressFormat`)
// to avoid the upward edge — the two are sibling owners of the same documented rule
// (memory `feedback_evm_address_lowercase`), not a duplication to merge.

// `/^0x[0-9a-fA-F]{40}$/`: only true EVM-format strings are lowercased. A non-EVM
// string (or a Solana base58 issuer that happens to flow through the EVM row) passes
// through unchanged — the byte-sensitive boundary.
const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

// One table row: the alg this ecosystem stamps + how it canonicalizes iss/aud.
interface EcosystemGrammar {
  alg: "ED25519" | "ETHEREUM"
  canonicalizeIssuer: (address: string) => string
}

// clique-acs authorization exact-matches `iss`/`aud` against auth rows stored in
// lowercase, while EVM signature recovery is casing-independent — so EVM addresses
// must enter the signed payload lowercased (wagmi hands out EIP-55 checksummed
// addresses). Solana base58 is case-significant; never normalize it.
//
// Intentionally narrower than the backend (which also accepts `SUI`): the gap is a
// documented product-scope decision. Adding Sui is one row here.
export const JWT_GRAMMAR = {
  evm: {
    alg: "ETHEREUM",
    canonicalizeIssuer: (address: string) =>
      EVM_ADDRESS_RE.test(address) ? address.toLowerCase() : address,
  },
  solana: {
    alg: "ED25519",
    canonicalizeIssuer: (address: string) => address,
  },
} as const satisfies Record<string, EcosystemGrammar>

// The chain ecosystem an identity signed in with. Derived from the table.
//
// Tier-0 mirror of `ChainKind` from `@repo/acs-client` — byte-identical union
// ('evm' | 'solana'), kept local by design: @repo/auth is tier-0 and must not
// import @repo/acs-client (one tier up). The two types are parallel owners of the
// same vocabulary; no cross-package import is intended or correct here.
export type ChainEcosystem = keyof typeof JWT_GRAMMAR

// The header `alg` values this client emits/recognizes. Derived from the table.
export type JwtAlg = (typeof JWT_GRAMMAR)[ChainEcosystem]["alg"]

// Reverse lookup: header `alg` → ecosystem (`ETHEREUM`→evm, `ED25519`→solana);
// null for unknown/absent alg. Backs `jwtEcosystem`.
export const ecosystemForAlg = (alg: string): ChainEcosystem | null => {
  for (const ecosystem of Object.keys(JWT_GRAMMAR) as ChainEcosystem[]) {
    if (JWT_GRAMMAR[ecosystem].alg === alg) return ecosystem
  }
  return null
}
