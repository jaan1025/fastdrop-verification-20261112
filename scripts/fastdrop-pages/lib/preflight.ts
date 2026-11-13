import {
  campaignScope,
  parseCampaign,
  parseVerification,
  record,
  rootHash,
  type Campaign,
  type Verification,
} from "./brief.ts"

export type CampaignInspection = {
  chainId: string
  root?: string
  roles: Record<string, unknown>
}

export type CampaignDependencies = {
  getDeployment: (campaign: Campaign) => unknown | Promise<unknown>
  inspectChain: (input: CampaignInspection) => unknown | Promise<unknown>
}

const sameAddress = (left: string, right: string): boolean =>
  /^0x/i.test(left) ? left.toLowerCase() === right.toLowerCase() : left === right

function resolveRoot(campaign: Campaign & { batch: string }, deployment: Record<string, unknown>): string {
  const extra = deployment.extra
  const roots =
    extra && typeof extra === "object" && !Array.isArray(extra) ? (extra as Record<string, unknown>).root : undefined
  if (roots != null) {
    const rows = record(roots, "ACS batch records")
    const entry = Object.hasOwn(rows, campaign.batch) ? rows[campaign.batch] : undefined
    if (entry != null) {
      const entryRecord =
        entry && typeof entry === "object" && !Array.isArray(entry) ? (entry as Record<string, unknown>) : undefined
      if (typeof entry !== "string" && entryRecord?.status != null && entryRecord.status !== "Approved") {
        throw new Error(`ACS batch ${campaign.batch} is ${String(entryRecord.status)}; use an approved batch.`)
      }
      const root = rootHash(typeof entry === "string" ? entry : entryRecord?.root, "ACS batch root")
      if (campaign.root && root !== campaign.root)
        throw new Error("The supplied root does not match the ACS batch root.")
      return root
    }
    if (Object.keys(rows).length) throw new Error(`ACS deployment does not list batch ${campaign.batch}.`)
  }
  if (campaign.root) return campaign.root
  throw new Error(
    `ACS did not return a root for batch ${campaign.batch}. Supply the root from its approved batch record.`,
  )
}

export function campaignInspection(campaign: Campaign, value: unknown): CampaignInspection {
  const deployment = record(value, "ACS deployment")
  const { chainId } = deployment
  if (typeof chainId !== "string" || !chainId) throw new Error("ACS deployment has no chainId.")
  if (campaign.chainId && campaign.chainId !== chainId)
    throw Object.assign(new Error("The requested chainId does not match the ACS deployment."), {
      code: "campaign_mismatch",
    })
  const roles = record(deployment.roles, "ACS deployment roles")
  if (typeof roles.contract !== "string" || !roles.contract) throw new Error("ACS deployment has no distributor role.")
  const root = campaign.batch ? resolveRoot({ ...campaign, batch: campaign.batch }, deployment) : undefined
  return { chainId, root, roles }
}

export function campaignVerification(campaign: Campaign, input: CampaignInspection, value: unknown): Verification {
  const chain = record(value, "chain configuration")
  const { chainId, root, roles } = input
  const result = parseVerification({
    ...chain,
    chainId,
    ...(root && { root }),
    distributor: roles.contract,
    scope: campaignScope(campaign),
  })
  if (campaign.token && !sameAddress(result.token, campaign.token))
    throw Object.assign(new Error("The requested token does not match the on-chain distributor."), {
      code: "campaign_mismatch",
    })
  return result
}

export async function verifyCampaign(
  input: unknown,
  { getDeployment, inspectChain }: CampaignDependencies,
): Promise<Verification> {
  const campaign = parseCampaign(input)
  const inspection = campaignInspection(campaign, await getDeployment(campaign))
  return campaignVerification(campaign, inspection, await inspectChain(inspection))
}
