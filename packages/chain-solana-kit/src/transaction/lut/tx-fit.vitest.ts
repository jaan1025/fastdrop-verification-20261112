import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  AccountRole,
  type Address,
  appendTransactionMessageInstruction,
  createTransactionMessage,
  getAddressDecoder,
  isTransactionMessageWithinSizeLimit,
  setTransactionMessageFeePayer,
} from "@solana/kit"
import { ensureTxFits } from "./tx-fit"

const fetchLutMock = vi.fn()
vi.mock("./table", () => ({
  fetchLut: (...args: unknown[]) => fetchLutMock(...args),
}))

const ensureLutCoversMock = vi.fn()
vi.mock("./cover", () => ({
  ensureLutCovers: (...args: unknown[]) => ensureLutCoversMock(...args),
}))

const testAddress = (byte: number) => getAddressDecoder().decode(new Uint8Array(32).fill(byte))
const payer = { address: testAddress(1) } as never
const programAddress = testAddress(2)
const accountAddresses = Array.from({ length: 40 }, (_, i) => testAddress(i + 3))
const message = setTransactionMessageFeePayer(
  testAddress(1),
  createTransactionMessage({ version: 0 }),
)
const oversizedMessage = appendTransactionMessageInstruction(
  {
    programAddress,
    accounts: accountAddresses.map((address) => ({ address, role: AccountRole.READONLY })),
  },
  message,
)
const SHARED_LUT = testAddress(50)
const CACHED_LUT = testAddress(51)
const EXTRA_LUT = testAddress(52)
const rpc = {} as never
const SQUADS = { name: "SquadsX" }
const PHANTOM = { name: "Phantom" }

beforeEach(() => {
  vi.resetAllMocks()
  const tables = {
    [SHARED_LUT]: accountAddresses.slice(0, 2),
    [CACHED_LUT]: accountAddresses.slice(2, 4),
    [EXTRA_LUT]: accountAddresses.slice(4),
  }
  fetchLutMock.mockImplementation(async (_rpc: unknown, address: Address) => ({
    addresses: tables[address],
  }))
  ensureLutCoversMock.mockResolvedValue({ lutAddress: EXTRA_LUT })
})

describe("ensureTxFits", () => {
  it("returns a transaction that already fits for a multisig wallet", async () => {
    const res = await ensureTxFits({ baseMessage: message, rpc, payer, wallet: SQUADS })
    expect(res).toEqual({ txMessage: message })
    expect(ensureLutCoversMock).not.toHaveBeenCalled()
  })

  it("rejects an oversized multisig transaction without creating a LUT", async () => {
    await expect(
      ensureTxFits({ baseMessage: oversizedMessage, rpc, payer, wallet: SQUADS }),
    ).rejects.toThrow(/multisig wallet cannot create an address lookup table/)
    expect(ensureLutCoversMock).not.toHaveBeenCalled()
  })

  it("rejects an oversized claimant transaction after trying its LUTs, without provisioning a LUT", async () => {
    expect(isTransactionMessageWithinSizeLimit(oversizedMessage)).toBe(false)
    await expect(
      ensureTxFits({
        baseMessage: oversizedMessage,
        rpc,
        payer,
        wallet: PHANTOM,
        lutAddresses: [SHARED_LUT, CACHED_LUT],
        allowCreateLut: false,
      }),
    ).rejects.toThrow(/provide a shared address lookup table/i)
    expect(fetchLutMock).toHaveBeenCalledWith(rpc, SHARED_LUT)
    expect(fetchLutMock).toHaveBeenCalledWith(rpc, CACHED_LUT)
    expect(ensureLutCoversMock).not.toHaveBeenCalled()
  })

  it("compresses with the available LUTs when creation is disabled", async () => {
    fetchLutMock.mockResolvedValueOnce({ addresses: accountAddresses.slice(0, 20) })
    fetchLutMock.mockResolvedValueOnce({ addresses: accountAddresses.slice(20) })
    const { txMessage, extraLutAddress } = await ensureTxFits({
      baseMessage: oversizedMessage,
      rpc,
      payer,
      wallet: PHANTOM,
      lutAddresses: [SHARED_LUT, CACHED_LUT],
      allowCreateLut: false,
    })
    expect(isTransactionMessageWithinSizeLimit(txMessage)).toBe(true)
    expect(extraLutAddress).toBeUndefined()
    expect(ensureLutCoversMock).not.toHaveBeenCalled()
  })

  it("can still provision an extra LUT for an oversized transaction by default", async () => {
    const { txMessage, extraLutAddress } = await ensureTxFits({
      baseMessage: oversizedMessage,
      rpc,
      payer,
      wallet: PHANTOM,
      lutAddresses: [SHARED_LUT, CACHED_LUT],
    })
    expect(ensureLutCoversMock).toHaveBeenCalledOnce()
    expect(extraLutAddress).toBe(EXTRA_LUT)
    expect(isTransactionMessageWithinSizeLimit(txMessage)).toBe(true)
  })
})
