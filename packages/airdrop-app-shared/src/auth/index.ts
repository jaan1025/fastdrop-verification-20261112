// Curated barrel for `@repo/airdrop-app-shared/auth`: login facade + auth hooks,
// headless gates, login UI, login utils. The per-chain login leaves
// (`use-evm-login`/`use-solana-login`) are INTERNAL — only the `useLogin` facade
// and the kind-driven `LoginButton` are public.
export { useLogin, type LoginKind } from "./hooks/use-login"
export { useLogout } from "./hooks/use-logout"
export { useInspectLoginToken, type LoginTokenResult } from "./hooks/use-inspect-login-token"
export { useLoginSuccessHandler, type LoginSuccessOptions } from "./hooks/use-login-success-handler"
export { useServerAuthErrorBridge } from "./hooks/use-server-auth-error-bridge"
export { CrossTabAuthGate, type CrossTabAuthGateProps } from "./components/cross-tab-auth-gate"
export {
  ServerAuthErrorGate,
  type ServerAuthErrorGateProps,
} from "./components/server-auth-error-gate"
export { RequireSession, type RequireSessionProps } from "./components/require-session"
export { ForbiddenState, type ForbiddenStateProps } from "./forbidden/forbidden-state"
export { LoginShell, type LoginShellProps } from "./login/login-shell"
export { LoginButton, type LoginButtonProps } from "./login/login-button"
export { ApiKeyForm, type ApiKeyFormProps } from "./login/api-key-form"
export { ToSConsentLine, type ToSConsentLineProps, type TosCopy } from "./login/tos-consent-line"
export { sanitizeNext } from "./utils/sanitize-next"
export { isCancelled } from "./utils/login-error"
