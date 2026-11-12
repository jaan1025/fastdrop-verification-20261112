/**
 * On-chain Address Lookup Table read primitives — fetch a LUT's contents and poll
 * until it is active. Shared by `contains` (provisioning) and `fit` (compression).
 */
import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import {
  fetchAddressLookupTable,
  type AddressLookupTable,
} from "@solana-program/address-lookup-table"
import { sleep } from "@repo/shared/utils"

/**
 * Waits for a LUT to become active (at least 1 slot after creation).
 */
export async function waitForLutActive(
  rpc: Rpc<SolanaRpcApi>,
  lutAddress: Address,
  maxRetries = 30,
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const lut = await fetchAddressLookupTable(rpc, lutAddress)
      if (lut.data.addresses.length > 0) {
        const currentSlot = await rpc.getSlot().send()
        if (currentSlot > lut.data.lastExtendedSlot) {
          return
        }
      }
    } catch {
      // LUT not yet available, continue waiting
    }
    await sleep(500)
  }
  throw new Error("LUT activation timeout")
}

/**
 * Fetches the addresses stored in a LUT.
 */
export async function fetchLut(
  rpc: Rpc<SolanaRpcApi>,
  lutAddress: Address,
): Promise<AddressLookupTable> {
  const lut = await fetchAddressLookupTable(rpc, lutAddress)
  return lut.data
}
