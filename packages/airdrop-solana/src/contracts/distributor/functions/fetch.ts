import type { Address, Rpc, SolanaRpcApi } from "@solana/kit"
import { fetchAndDecodeAccount } from "@repo/chain-solana-kit/utils"
import { getClaimStatusPDA } from "./pda"
import {
  MERKLE_DISTRIBUTOR_DISCRIMINATOR,
  getMerkleDistributorDecoder,
  type MerkleDistributor,
} from "../generated/accounts/merkleDistributor"
import {
  CLAIM_STATUS_DISCRIMINATOR,
  getClaimStatusDecoder,
  type ClaimStatus,
} from "../generated/accounts/claimStatus"
import {
  CLAIM_ROOT_DISCRIMINATOR,
  getClaimRootDecoder,
  type ClaimRoot,
} from "../generated/accounts/claimRoot"
import {
  FEE_CONFIG_DISCRIMINATOR,
  getFeeConfigDecoder,
  type FeeConfig,
} from "../generated/accounts/feeConfig"
import {
  BATCH_CONFIG_DISCRIMINATOR,
  getBatchConfigDecoder,
  type BatchConfig,
} from "../generated/accounts/batchConfig"
import {
  STREAM_PRESET_DISCRIMINATOR,
  getStreamPresetDecoder,
  type StreamPreset,
} from "../generated/accounts/streamPreset"
import {
  PENALTY_CONFIG_DISCRIMINATOR,
  getPenaltyConfigDecoder,
  type PenaltyConfig,
} from "../generated/accounts/penaltyConfig"

export type {
  MerkleDistributor,
  ClaimStatus,
  ClaimRoot,
  FeeConfig,
  BatchConfig,
  StreamPreset,
  PenaltyConfig,
}

export const fetchMerkleDistributor = async (
  rpc: Rpc<SolanaRpcApi>,
  address: Address,
): Promise<MerkleDistributor | null> =>
  fetchAndDecodeAccount({
    rpc,
    address,
    expectedDiscriminator: MERKLE_DISTRIBUTOR_DISCRIMINATOR,
    decode: getMerkleDistributorDecoder().decode,
  })

export const fetchClaimStatus = async (
  rpc: Rpc<SolanaRpcApi>,
  address: Address,
): Promise<ClaimStatus | null> =>
  fetchAndDecodeAccount({
    rpc,
    address,
    expectedDiscriminator: CLAIM_STATUS_DISCRIMINATOR,
    decode: getClaimStatusDecoder().decode,
  })

export const fetchClaimRoot = async (
  rpc: Rpc<SolanaRpcApi>,
  address: Address,
): Promise<ClaimRoot | null> =>
  fetchAndDecodeAccount({
    rpc,
    address,
    expectedDiscriminator: CLAIM_ROOT_DISCRIMINATOR,
    decode: getClaimRootDecoder().decode,
  })

export const fetchFeeConfig = async (
  rpc: Rpc<SolanaRpcApi>,
  address: Address,
): Promise<FeeConfig | null> =>
  fetchAndDecodeAccount({
    rpc,
    address,
    expectedDiscriminator: FEE_CONFIG_DISCRIMINATOR,
    decode: getFeeConfigDecoder().decode,
  })

export const fetchBatchConfig = async (
  rpc: Rpc<SolanaRpcApi>,
  address: Address,
): Promise<BatchConfig | null> =>
  fetchAndDecodeAccount({
    rpc,
    address,
    expectedDiscriminator: BATCH_CONFIG_DISCRIMINATOR,
    decode: getBatchConfigDecoder().decode,
  })

export const fetchStreamPreset = async (
  rpc: Rpc<SolanaRpcApi>,
  address: Address,
): Promise<StreamPreset | null> =>
  fetchAndDecodeAccount({
    rpc,
    address,
    expectedDiscriminator: STREAM_PRESET_DISCRIMINATOR,
    decode: getStreamPresetDecoder().decode,
  })

export const fetchPenaltyConfig = async (
  rpc: Rpc<SolanaRpcApi>,
  address: Address,
): Promise<PenaltyConfig | null> =>
  fetchAndDecodeAccount({
    rpc,
    address,
    expectedDiscriminator: PENALTY_CONFIG_DISCRIMINATOR,
    decode: getPenaltyConfigDecoder().decode,
  })

export const getClaimStatus = async (
  rpc: Rpc<SolanaRpcApi>,
  params: {
    distributor: Address
    claimRoot: Address
    handler: Uint8Array
  },
): Promise<ClaimStatus | null> => {
  const [claimStatusPda] = await getClaimStatusPDA(params)
  return fetchClaimStatus(rpc, claimStatusPda)
}
