import { describe, expect, it, vi } from "vitest"
import type { AcsClient } from "../../transport"
import { getClaimData, quoteClaimData } from "./claim"

const addressHandler = "0xabCDeF0123456789AbcdEf0123456789aBCDEF01"

describe("ACS claim handler key", () => {
  it.each([
    { dynamicRecipient: true, expected: addressHandler },
    { dynamicRecipient: undefined, expected: addressHandler.toLowerCase() },
  ])(
    "keeps quote and co-sign in the same handler mode: $dynamicRecipient",
    async ({ dynamicRecipient, expected }) => {
      const request = vi.fn().mockResolvedValue({ released: "42" })
      const client: AcsClient = { kind: "public", appId: "app", deploymentId: "project", request }
      const params = { batch: "batch", addressHandler, sig: "tos", dynamicRecipient }
      await quoteClaimData(client, params)
      await getClaimData(client, { ...params, extra: "0x00" })

      const body = {
        appId: "app",
        deployment: "project",
        batch: "batch",
        addressHandler: expected,
        sig: "tos",
      }
      expect(request.mock.calls).toEqual([
        ["/claim", { method: "POST", body }],
        ["/claim", { method: "POST", body: { ...body, extra: "0x00" } }],
      ])
    },
  )
})
