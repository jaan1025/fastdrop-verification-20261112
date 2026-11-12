/**
 * [golden-test] The EVM address-format leaf (§2.7): lowercases the address before
 * it is substituted into the ToS template, matching ACS `Extra::tos_message`
 * (EVM is case-insensitive; the backend mirrors the lowercase form). The Solana
 * arm keeps base58 verbatim — the chain decision lives here at the leaf, never
 * inside the pure `buildToSMessage` builder.
 */
export const formatAddressForTemplate = (address: string): string => address.toLowerCase()
