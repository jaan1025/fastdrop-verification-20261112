// Repository build adapter. It compiles trusted source before any verification.
import { execFileSync } from "node:child_process"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import type { CampaignDependencies } from "./preflight.ts"

export async function buildCampaignReaders(
  site: string,
  environment: Record<string, string | undefined>,
): Promise<CampaignDependencies> {
  execFileSync(process.execPath, ["--experimental-strip-types", "apps/claim/scripts/build-fastdrop-inspector.ts"], {
    cwd: site,
    stdio: "inherit",
  })
  const { inspectChain } = await import(pathToFileURL(resolve(site, ".fastdrop-build/inspector/index.mjs")).href)
  const providers = { alchemyApiKey: environment.VITE_ALCHEMY_API_KEY, solanaRpcUrl: environment.VITE_SOLANA_RPC_URL }
  return {
    async getDeployment(campaign) {
      const response = await fetch(`${campaign.acsUrl}/deployment`, {
        method: "POST",
        redirect: "error",
        credentials: "omit",
        headers: { "content-type": "application/json", "clq-app-id": campaign.appId },
        body: JSON.stringify({ appId: campaign.appId, name: campaign.deployment }),
        signal: AbortSignal.timeout(15_000),
      })
      if (!response.ok) throw new Error(`ACS deployment lookup failed (HTTP ${response.status}).`)
      return response.json()
    },
    inspectChain: (input) => inspectChain(input, providers),
  }
}
