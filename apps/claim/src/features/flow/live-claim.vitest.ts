import { describe, expect, it } from "vitest"

import { canReviewClaim, formatClaimAmount, readCampaignRoot } from "./live-claim"

describe("live claim", () => {
  it("keeps a partially used allocation open for a new review", () => {
    expect(canReviewClaim(100n, 40n)).toBe(true)
    expect(canReviewClaim(100n, 100n)).toBe(false)
  })

  it("requires an explicit 32-byte campaign root", () => {
    expect(readCampaignRoot(undefined)).toBeUndefined()
    expect(readCampaignRoot("0x1234")).toBeUndefined()
    expect(readCampaignRoot(`0x${"AB".repeat(32)}`)).toBe(`0x${"ab".repeat(32)}`)
  })

  it("shows a nonzero payout at the smallest token unit", () => {
    expect(formatClaimAmount(1n, 18)).toBe("0.000000000000000001")
  })
})
