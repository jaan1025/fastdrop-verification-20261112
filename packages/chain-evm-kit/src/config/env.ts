// (internal) Injected EVM RPC config. The Alchemy API key is sourced from env at
// call time — never a hardcoded module literal (analysis 6.8 / L8: no secrets in
// shipped paths). The key flows from the app composition root's env (Vite
// `VITE_ALCHEMY_API_KEY`, or `process.env` for node/test tooling). Not exported
// from `/config` — internal to `supported-chains.ts` / `wagmi-config.ts`.

const readEnv = (key: string): string | undefined => {
  // Vite injects `import.meta.env` at build; node/vitest exposes `process.env`.
  const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
  return viteEnv?.[key] ?? globalThis.process?.env?.[key]
}

/**
 * Returns the Alchemy key from the env-injected config; throws a descriptive
 * error if unset (fail-fast rather than silently building broken RPC URLs).
 */
export const getAlchemyApiKey = (): string => {
  const key = readEnv("VITE_ALCHEMY_API_KEY")
  if (!key) {
    throw new Error(
      "VITE_ALCHEMY_API_KEY is not set. Provide the Alchemy API key via the app composition root env.",
    )
  }
  return key
}

/** Composes `https://<subdomain>.g.alchemy.com/v2/<key>` from the injected key. */
export const buildAlchemyRpcUrl = (subdomain: string): string =>
  `https://${subdomain}.g.alchemy.com/v2/${getAlchemyApiKey()}`
