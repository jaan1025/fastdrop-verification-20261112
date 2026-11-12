import { fileURLToPath } from "node:url"
import { createServer, type ViteDevServer } from "vite"

const server: ViteDevServer = await createServer({
  root: fileURLToPath(new URL("../../../", import.meta.url)),
  configFile: false,
  envDir: false,
  logLevel: "silent",
  server: { middlewareMode: true, watch: null, ws: false },
  ssr: { noExternal: [/^@repo\//] },
})

try {
  await server.ssrLoadModule("/scripts/fastdrop-inspect.ts")
} finally {
  await server.close()
}
