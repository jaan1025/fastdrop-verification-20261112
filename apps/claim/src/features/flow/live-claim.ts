export type CampaignRoot = `0x${string}`

export const readCampaignRoot = (value: unknown): CampaignRoot | undefined =>
  typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value)
    ? (value.toLowerCase() as CampaignRoot)
    : undefined

export const canReviewClaim = (allocation: bigint, consumed: bigint | undefined) =>
  consumed === undefined || consumed < allocation

export const formatClaimAmount = (amount: bigint, decimals: number | undefined) => {
  if (decimals === undefined) return `${amount.toLocaleString("en-US")} base units`
  const scale = 10n ** BigInt(decimals)
  const whole = (amount / scale).toLocaleString("en-US")
  const fraction = (amount % scale).toString().padStart(decimals, "0").replace(/0+$/, "")
  return fraction ? `${whole}.${fraction}` : whole
}

export const formatClaimDate = (unixSeconds: bigint) =>
  new Date(Number(unixSeconds) * 1000).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC"
