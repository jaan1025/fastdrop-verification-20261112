import { describe, expect, it, vi } from "vitest"
import type { AcsClient } from "@repo/acs-client/transport"
import type { Configuration } from "@repo/airdrop-base/distributor"
import {
  assertCampaignRoot,
  evaluatePortalDelivery,
  prepareClaimReview,
  readPortalAllocation,
  resolveClaimRelease,
} from "./portal-claim-review"

const scope = {
  batch: "batch",
  deploymentId: "deployment",
  addressHandler: "0xAa00000000000000000000000000000000000000",
  sig: "tos-signature",
}
const relaySignature = `0x${"ab".repeat(65)}`
const transfer: Configuration = {
  chainKind: "evm",
  fallbackIndex: 0,
  strategies: [{ kind: "transferHook", proportion: 0n }],
}

describe("reviewed distributor claim", () => {
  async function prepare() {
    const request = vi.fn().mockResolvedValueOnce({ released: "75", sig: null })
    const client: AcsClient = {
      kind: "public",
      appId: "organization",
      deploymentId: undefined,
      request,
    }
    const readConsumed = vi.fn().mockResolvedValue(25n)
    const release = await resolveClaimRelease({ client, scope, allocation: 100n, readConsumed })
    const { delivery } = evaluatePortalDelivery(transfer, release, 100n)
    const beforeCoSign = vi.fn()
    const validate = vi.fn(async () => {
      if ((await readConsumed()) !== release.consumed) throw new Error("Consumption changed")
      return "wallet"
    })
    const send = vi.fn().mockResolvedValue("confirmed hash")
    const review = prepareClaimReview({
      client,
      scope,
      release,
      delivery,
      extra: "0x0102",
      beforeCoSign,
      validate,
      send,
    })
    return { review, request, send, readConsumed, beforeCoSign, validate }
  }

  it("previews released minus consumed and sends the reviewed extra only after submit", async () => {
    const { review, request, send } = await prepare()
    expect(review).toMatchObject({
      allocation: 100n,
      released: 75n,
      consumed: 25n,
      claimable: 50n,
      walletAmount: 50n,
      lockedAmount: 0n,
      forfeitedAmount: 0n,
    })
    expect(request).toHaveBeenCalledExactlyOnceWith("/claim", {
      method: "POST",
      body: {
        appId: "organization",
        deployment: "deployment",
        batch: "batch",
        addressHandler: scope.addressHandler.toLowerCase(),
        sig: scope.sig,
      },
    })
    expect(send).not.toHaveBeenCalled()
    request.mockResolvedValue({ released: "75", sig: relaySignature })
    await expect(review.submit()).resolves.toBe("confirmed hash")
    expect(request.mock.lastCall?.[1].body.extra).toBe("0x0102")
    expect(send).toHaveBeenCalledExactlyOnceWith(relaySignature, "wallet")
    await expect(review.submit()).rejects.toThrow("Prepare a new claim")
  })

  it.each([{ released: "76" }, { released: "74" }, {}])(
    "does not submit when co-signing returns a different or missing release: %j",
    async (response) => {
      const { review, request, send } = await prepare()
      request.mockResolvedValue({ ...response, sig: relaySignature })
      await expect(review.submit()).rejects.toThrow(/released amount/i)
      expect(send).not.toHaveBeenCalled()
    },
  )

  it("blocks a change to the on-chain consumption after review", async () => {
    const { review, request, readConsumed, send } = await prepare()
    request.mockResolvedValue({ released: "75", sig: relaySignature })
    readConsumed.mockResolvedValue(26n)
    await expect(review.submit()).rejects.toThrow("Consumption changed")
    expect(send).not.toHaveBeenCalled()
  })

  it("expires the review before asking ACS to co-sign", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(10_000)
    try {
      const { review, request, send } = await prepare()
      now.mockReturnValue(71_000)
      await expect(review.submit()).rejects.toThrow("expired")
      expect(request).toHaveBeenCalledTimes(1)
      expect(send).not.toHaveBeenCalled()
    } finally {
      now.mockRestore()
    }
  })

  it("does not accept an allocation that would truncate in the Solana Merkle leaf", async () => {
    const address = "So11111111111111111111111111111111111111112"
    const request = vi.fn().mockResolvedValue({
      data: [
        {
          batch: "batch",
          addressHandler: address,
          allocation: (2n ** 64n + 1n).toString(),
          extra: { proof: [] },
        },
      ],
    })
    const client: AcsClient = {
      kind: "public",
      appId: "organization",
      deploymentId: undefined,
      request,
    }
    await expect(
      readPortalAllocation(client, {
        chainKind: "solana",
        batch: "batch",
        deploymentId: "deployment",
        address,
        amountBits: 64,
      }),
    ).rejects.toThrow("allocation amount is too large")
  })

  it("rejects a proof for a different campaign root", () => {
    expect(() => assertCampaignRoot(`0x${"a".repeat(64)}`, `0x${"b".repeat(64)}`)).toThrow(
      "does not match the campaign root",
    )
  })

  it("uses the same penalty consumption for fallback sizing and the displayed amounts", () => {
    const configuration: Configuration = {
      chainKind: "evm",
      fallbackIndex: 1,
      strategies: [
        {
          kind: "linearPenaltyHook",
          proportion: 400_000_000_000_000_000n,
          penalty: { chainKind: "evm", beginTime: 100n, endTime: 200n },
        },
        { kind: "transferHook", proportion: 0n },
        { kind: "lockHook", proportion: 400_000_000_000_000_000n },
      ],
    }
    const release = { allocation: 101n, released: 101n, consumed: 0n, claimable: 101n }
    const { delivery, byStrategy } = evaluatePortalDelivery(configuration, release, 150n)
    expect(delivery).toEqual({
      walletAmount: 41n,
      lockedAmount: 40n,
      forfeitedAmount: 20n,
      penaltyWindows: [{ beginTime: 100n, endTime: 200n }],
    })
    expect(byStrategy.map(({ consumed }) => consumed)).toEqual([20n, 41n, 40n])
  })

  it("rejects unknown hooks, partial lock, and configurations that cannot consume the delta", () => {
    const release = {
      allocation: 100n,
      consumed: 25n,
      released: 75n,
      claimable: 50n,
    }
    expect(() =>
      evaluatePortalDelivery(
        { ...transfer, strategies: [{ kind: "customHook", proportion: 0n }] },
        release,
        100n,
      ),
    ).toThrow("Unsupported")
    expect(() =>
      evaluatePortalDelivery(
        { ...transfer, strategies: [{ kind: "lockHook", proportion: 0n }] },
        release,
        100n,
      ),
    ).toThrow("Partial claims are not supported")
    expect(() => evaluatePortalDelivery({ ...transfer, fallbackIndex: 1 }, release, 100n)).toThrow(
      "does not consume",
    )
  })
})
