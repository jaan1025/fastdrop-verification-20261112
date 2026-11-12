import { describe, expect, it } from "vitest"

import { claimStep } from "./claim-step"

describe("default claim flow", () => {
  it("waits for Next after a wallet is checked, then shows the eligibility result", () => {
    expect(claimStep({ phase: "connect" }, true)).toBe("connect")
    expect(claimStep({ phase: "checking" }, true)).toBe("connect")
    expect(claimStep({ phase: "ineligible" }, false)).toBe("connect")
    expect(claimStep({ phase: "ineligible" }, true)).toBe("eligibility")
    expect(claimStep({ phase: "ready", allocation: 100n, consumed: 20n }, false)).toBe("connect")
    expect(claimStep({ phase: "ready", allocation: 100n, consumed: 20n }, true)).toBe("action")
  })

  it("shows completion for a confirmed or fully used allocation", () => {
    expect(claimStep({ phase: "ready", allocation: 100n, consumed: 100n }, true)).toBe("complete")
    expect(claimStep({ phase: "ready", allocation: 100n, receipt: { hash: "test" } }, true)).toBe("complete")
    expect(claimStep({ phase: "ready", allocation: 100n }, true)).toBe("action")
  })
})
