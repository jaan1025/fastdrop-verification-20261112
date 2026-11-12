"use client"
import { type Address } from "@solana/kit"
import { useQuery } from "@tanstack/react-query"
import type { QueryParameter } from "@repo/acs-client/react"
import {
  solanaClaimStatusPdaQueryOptions,
  type SolanaClaimStatusPdaData,
  type SolanaClaimStatusPdaQueryKey,
} from "../../../query/distributor"

export type UseClaimStatusPdaParameters = {
  base: Address | undefined
  root: `0x${string}` | undefined
  /** Merkle-leaf / allocation key (`addressHandler`). */
  handler: string | undefined
} & QueryParameter<
  SolanaClaimStatusPdaData,
  Error,
  SolanaClaimStatusPdaData,
  SolanaClaimStatusPdaQueryKey
>

/**
 * Derives the ClaimStatus PDA from base, root, and the merkle-leaf handler.
 * Pure computation (no RPC calls), cached indefinitely.
 */
export const useClaimStatusPda = (parameters: UseClaimStatusPdaParameters) => {
  const { query, ...params } = parameters
  return useQuery({
    ...solanaClaimStatusPdaQueryOptions(params),
    ...query,
  })
}
