// Fastdrop managed Pages entry. Runs only in the repository's unprivileged build job.
import { readFileSync, mkdirSync, copyFileSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { parseManifest, siteEnv } from "./lib/brief.ts"
import { verifyCampaign } from "./lib/preflight.ts"
import { normalizeProviderVars, assertLiveProviders, PUBLIC_PROVIDER_KEYS } from "./lib/preview-policy.ts"
import { buildCampaignReaders } from "./lib/campaign-readers.ts"

const manifest = parseManifest(JSON.parse(readFileSync("fastdrop.json", "utf8")))
const release = JSON.parse(readFileSync("fastdrop.release.json", "utf8"))
if (!manifest.campaign || !manifest.verification || release.mode !== "live") throw new Error("Pages requires a verified live campaign.")
const providers = normalizeProviderVars(Object.fromEntries([...PUBLIC_PROVIDER_KEYS].filter((key) => process.env[key]?.trim()).map((key) => [key, process.env[key]])))
assertLiveProviders(manifest.verification.chainId, providers)
const verification = await verifyCampaign(manifest.campaign, await buildCampaignReaders(process.cwd(), providers))
if (JSON.stringify(verification) !== JSON.stringify(manifest.verification)) throw new Error("Campaign binding changed since release preparation. Verify the campaign again in Studio.")
const site = new URL(release.siteUrl)
if (site.protocol !== "https:" || site.username || site.password || site.search || site.hash) throw new Error("Invalid Pages URL.")
const base = site.pathname.replace(/\/?$/, "/")
const env = { ...process.env, ...providers, ...siteEnv(manifest) }
function run(args: string[]) {
  const result = spawnSync("pnpm", args, { stdio: "inherit", env })
  if (result.error || result.status !== 0) throw new Error("Pages build or typecheck failed.")
}
run(["--filter", "claim", "exec", "vite", "build", "--base", base])
run(["--filter", "claim", "exec", "node", "--experimental-strip-types", "scripts/export-static.ts"])
run(["--filter", "claim", "check-types"])
const output = "apps/claim/dist"
mkdirSync(`${output}/flow`, { recursive: true })
copyFileSync(`${output}/index.html`, `${output}/flow/index.html`)
copyFileSync(`${output}/index.html`, `${output}/404.html`)
writeFileSync(`${output}/.nojekyll`, "")
