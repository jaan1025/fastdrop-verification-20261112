import { getProgramDerivedAddress, type Address } from "@solana/kit"

export type PdaResult = readonly [Address, number]

export const createPdaFinder = (programAddress: Address) => {
  const textEncoder = new TextEncoder()
  return async (seeds: (Uint8Array | string)[]): Promise<PdaResult> => {
    const encodedSeeds = seeds.map((seed) =>
      typeof seed === "string" ? textEncoder.encode(seed) : seed,
    )
    const result = await getProgramDerivedAddress({
      programAddress,
      seeds: encodedSeeds,
    })
    return [result[0], result[1]] as const
  }
}
