import { defineConfig } from "vitest/config"

// Single root config for the monorepo. Cross-package `@repo/*` imports resolve via
// the pnpm-linked package `exports` maps (which point at raw `./src/*.ts`), so no
// build step is needed before running tests. Pure logic/byte-contract tests run in
// the node environment; a React/DOM test can opt in per-file with
// `// @vitest-environment jsdom`.
export default defineConfig({
  test: {
    environment: "node",
    // Chain config (`chain-evm-kit/config`) builds Alchemy RPC URLs at module load
    // and fail-fasts if the key is unset; provide a dummy so tests that transitively
    // import the chain stack load.
    env: { VITE_ALCHEMY_API_KEY: "test-key" },
    include: ["packages/**/*.{test,spec,vitest}.ts", "apps/**/*.{test,spec,vitest}.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.turbo/**", "**/.tanstack/**"],
  },
})
