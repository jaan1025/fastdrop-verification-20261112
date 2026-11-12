import type { Address, Commitment, Rpc, SolanaRpcApi } from "@solana/kit"
import { base64ToBytes } from "@repo/shared/utils"

type FetchAndDecodeParams<T> = {
  rpc: Rpc<SolanaRpcApi>
  address: Address
  expectedDiscriminator: Uint8Array
  decode: (data: Uint8Array) => T
  commitment?: Commitment
}

export const fetchAndDecodeAccount = async <T>({
  rpc,
  address,
  expectedDiscriminator,
  decode,
  commitment = "confirmed",
}: FetchAndDecodeParams<T>): Promise<T | null> => {
  const response = await rpc.getAccountInfo(address, { commitment, encoding: "base64" }).send()

  if (!response.value?.data) {
    return null
  }

  const dataArray = response.value.data as unknown as [string, string]
  if (!dataArray[0]) {
    return null
  }

  const data = base64ToBytes(dataArray[0])
  if (data.length < 8) {
    return null
  }

  const discriminator = data.slice(0, 8)
  if (discriminator.toString() !== expectedDiscriminator.toString()) {
    return null
  }

  return decode(data)
}
