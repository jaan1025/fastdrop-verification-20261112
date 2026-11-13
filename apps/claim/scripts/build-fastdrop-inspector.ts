// Build-time adapter. The output is a plain callable Node library with no Vite runtime.
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { resolve } from "node:path"
import { build } from "vite"
const root = fileURLToPath(new URL("../../../", import.meta.url))
execFileSync(
  resolve(root, "apps/claim/node_modules/.bin/tsc"),
  ["--project", resolve(root, "tsconfig.inspector.json")],
  { stdio: "inherit" },
)
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, ".fastdrop-build/inspector")
await build({
  root,
  configFile: false,
  envDir: false,
  logLevel: "warn",
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  plugins: [
    {
      name: "fastdrop-inspector-boundary",
      generateBundle(_options, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== "chunk") continue
          for (const [id, module] of Object.entries(chunk.modules)) {
            if (!module.renderedLength || id.includes("node_modules")) continue
            if (/\/apps\/|\/scripts\/|\/src\/react\/|\/config\/env\.ts$|\/wagmi-config\.ts$|\/client-env\.ts$/.test(id))
              this.error(`Chain inspector imports an application or ambient-config module: ${id}`)
          }
        }
      },
    },
  ],
  ssr: { noExternal: true },
  build: {
    ssr: resolve(root, "packages/fastdrop-inspector/src/index.ts"),
    target: "node22",
    outDir: output,
    emptyOutDir: false,
    minify: false,
    rolldownOptions: { output: { entryFileNames: "index.mjs", codeSplitting: false } },
  },
})
