export const fastdropLive = import.meta.env.VITE_FASTDROP_MODE === "live"

const expectedChainId = import.meta.env.VITE_FASTDROP_CHAIN_ID
const expectedDistributor = import.meta.env.VITE_FASTDROP_DISTRIBUTOR
const dynamicRecipientMode = import.meta.env.VITE_FASTDROP_DYNAMIC_RECIPIENT
export const campaignDynamicRecipient = dynamicRecipientMode === "true"
export const campaignSolanaBase: string | undefined = import.meta.env.VITE_FASTDROP_SOLANA_BASE

export const fastdropCampaignReady = Boolean(
  expectedChainId && expectedDistributor && import.meta.env.VITE_APP_ID &&
  (dynamicRecipientMode === "true" || dynamicRecipientMode === "false") &&
  (!/^sol:/i.test(expectedChainId) || campaignSolanaBase) &&
  import.meta.env.VITE_DEPLOYMENT && import.meta.env.VITE_TARGET_BATCH &&
  import.meta.env.VITE_ACS_API_BASE_URL && /^0x[0-9a-f]{64}$/.test(import.meta.env.VITE_FASTDROP_ROOT ?? ""),
)

export function matchesCampaignDeployment(chainId?: string, distributor?: string) {
  if (!fastdropCampaignReady || chainId !== expectedChainId || !distributor) return false
  return distributor.startsWith("0x")
    ? distributor.toLowerCase() === expectedDistributor.toLowerCase()
    : distributor === expectedDistributor
}
