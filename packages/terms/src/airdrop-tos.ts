// VERSIONED WIRE ARTIFACT — do NOT edit the bytes casually.
//
// The exact UTF-8 bytes of `airdropToS` (INCLUDING the leading/trailing
// newlines of this template literal) are the input to
// `sha256(utf8(airdropToS))`. That digest is the cross-chain ToS signature
// identity: it is computed independently in each chain kit (EVM / Solana / Sui
// tos-signer constants) and in the registration server's ToS service, and used
// as the storage/idempotency key for a user's ToS signature.
//
// Changing the content, whitespace, or encoding rotates that identity — every
// previously-stored signature identifier and the server's TOS_HASH diverge.
// The stub bytes below (`"\ntos\n"`) are pinned by a golden hash test
// (see airdrop-tos.golden.test.ts). A concrete deployment overrides this stub
// with real markdown, which deliberately rotates the hash for that deployment.
export const airdropToS = `
tos
`
