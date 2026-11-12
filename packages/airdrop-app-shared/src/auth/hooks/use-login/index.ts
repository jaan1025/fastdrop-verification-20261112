// Barrel for the `useLogin` chain-dispatch family: re-exports the facade so the
// `./hooks/use-login` import specifier still resolves to the public surface.
// The per-chain arms (`use-evm-login`/`use-solana-login`) stay family-private —
// only the facade is re-exported here.
export { useLogin, type LoginKind, type LoginState, type UseLoginResult } from "./use-login"
