import { getAddressEncoder, type Address } from "@solana/kit"
import { createPdaFinder, type PdaResult } from "@repo/chain-solana-kit/utils"
import { MERKLE_DISTRIBUTOR_PROGRAM_ADDRESS } from "../generated/programs/merkleDistributor"
import { toUint8Array } from "@repo/chain-solana-kit/utils"

export type { PdaResult }

const addressEncoder = getAddressEncoder()
const findPda = createPdaFinder(MERKLE_DISTRIBUTOR_PROGRAM_ADDRESS)

export const getDistributorPDA = async (base: Address): Promise<PdaResult> =>
  findPda(["MerkleDistributor", toUint8Array(addressEncoder.encode(base))])

export const getClaimStatusPDA = async (params: {
  distributor: Address
  claimRoot: Address
  handler: Uint8Array
}): Promise<PdaResult> =>
  findPda([
    "ClaimStatus",
    toUint8Array(addressEncoder.encode(params.distributor)),
    toUint8Array(addressEncoder.encode(params.claimRoot)),
    params.handler,
  ])

export const getClaimRootPDA = async (params: {
  distributor: Address
  root: Uint8Array
}): Promise<PdaResult> =>
  findPda(["ClaimRoot", toUint8Array(addressEncoder.encode(params.distributor)), params.root])

export const getFeeConfigPDA = async (params: {
  distributor: Address
  root: Uint8Array
}): Promise<PdaResult> =>
  findPda(["FeeConfig", toUint8Array(addressEncoder.encode(params.distributor)), params.root])

export const getBatchConfigPDA = async (params: {
  distributor: Address
  configurator: Uint8Array
}): Promise<PdaResult> =>
  findPda([
    "BatchConfig",
    toUint8Array(addressEncoder.encode(params.distributor)),
    params.configurator,
  ])

export const getStreamPresetPDA = async (params: {
  distributor: Address
  configurator: Uint8Array
}): Promise<PdaResult> =>
  findPda([
    "StreamPreset",
    toUint8Array(addressEncoder.encode(params.distributor)),
    params.configurator,
  ])

export const getPenaltyConfigPDA = async (params: {
  distributor: Address
  configurator: Uint8Array
}): Promise<PdaResult> =>
  findPda([
    "PenaltyConfig",
    toUint8Array(addressEncoder.encode(params.distributor)),
    params.configurator,
  ])

/**
 * Derives nftMint PDA from `[b"nft_mint", distributor, stream_id]`. The nftMint
 * is created by the merkle-distributor program as a PDA.
 */
export const getNftMintPDA = async (params: {
  distributor: Address
  streamId: Uint8Array
}): Promise<PdaResult> =>
  findPda(["nft_mint", toUint8Array(addressEncoder.encode(params.distributor)), params.streamId])
