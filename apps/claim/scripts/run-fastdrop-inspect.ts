// Explicit CLI adapter; Studio imports its prebuilt library directly.
import { createServer } from "vite"
import { fileURLToPath } from "node:url"
const server = await createServer({
  root: fileURLToPath(new URL("../../../", import.meta.url)),
  configFile: false,
  envDir: false,
  logLevel: "silent",
  server: { middlewareMode: true, watch: null, ws: false },
  ssr: { noExternal: [/^@repo\//] },
})
try { await server.ssrLoadModule("/scripts/fastdrop-inspect.ts") }
finally { await server.close() }
