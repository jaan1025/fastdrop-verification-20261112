import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from "@solana-program/compute-budget"
import type { Instruction } from "@solana/kit"

export const DEFAULT_COMPUTE_UNITS = 200_000
export const DEFAULT_PRIORITY_FEE = 200_000n

export const getComputeBudgetInstructions = (params?: {
  units?: number
  priorityFee?: bigint
}): Instruction[] => [
  getSetComputeUnitLimitInstruction({ units: params?.units ?? DEFAULT_COMPUTE_UNITS }),
  getSetComputeUnitPriceInstruction({ microLamports: params?.priorityFee ?? DEFAULT_PRIORITY_FEE }),
]
