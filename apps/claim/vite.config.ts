import { fileURLToPath } from "node:url"
import { defineConfig, loadEnv } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

async function sentryPlugins() {
  if (!process.env.VITE_SENTRY_DSN) return []
  const { withSentry } = await import("@repo/sentry/vite")
  return withSentry({ project: "claim" })
}

export default defineConfig(async ({ command, mode }) => {
  const root = fileURLToPath(new URL("./", import.meta.url))
  const env = loadEnv(mode, root)
  const live = env.VITE_FASTDROP_MODE === "live"
  if (command === "build" && live) {
    const chainId = env.VITE_FASTDROP_CHAIN_ID ?? ""
    const providerKeys = /^\d+$/.test(chainId)
      ? ["VITE_ALCHEMY_API_KEY", "VITE_WALLET_CONNECT_PROJECT_ID"]
      : /^sol:/.test(chainId)
        ? ["VITE_SOLANA_RPC_URL"]
        : null
    if (!providerKeys) throw new Error("Run Fastdrop preflight before building a live campaign.")
    for (const key of providerKeys) {
      if (!env[key]?.trim()) throw new Error(`Set ${key} before building this live campaign.`)
    }
  }
  const entry = live ? "./src/features/flow/live-entry.ts" : "./src/features/claim/demo-claim-runtime.tsx"
  return {
    root,
    server: { port: 3000 },
    resolve: {
      tsconfigPaths: true,
      // pnpm peer variants must share the Wagmi context across workspace packages.
      dedupe: ["wagmi"],
      // Resolve one entry before constructing the bundle graph. A live build
      // cannot import the preview data; a demo cannot import wallet providers.
      alias: { "virtual:fastdrop-claim-runtime": fileURLToPath(new URL(entry, import.meta.url)) },
    },
    build: { outDir: ".fastdrop-build", sourcemap: Boolean(process.env.VITE_SENTRY_DSN) },
    plugins: [
      tailwindcss(),
      tanstackStart({ spa: { enabled: true, prerender: { outputPath: "/index.html" } } }),
      viteReact(),
      ...(await sentryPlugins()),
    ],
  }
})
