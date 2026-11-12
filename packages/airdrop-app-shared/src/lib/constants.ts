/**
 * Display fallback for a token whose symbol can't be resolved — e.g. a mint
 * with no on-chain metadata. Shared by both consoles + the portal so the
 * "unknown token" label reads identically everywhere a symbol would otherwise
 * be shown (header subtitle, amount units, project-switcher).
 */
export const UNKNOWN_TOKEN_SYMBOL = "UNKNOWN"
