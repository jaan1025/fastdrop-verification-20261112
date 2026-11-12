import type { FeeConfig } from "./fetch"
import { isFeeMode } from "../generated/types/feeMode"
import { WAD_SOL } from "@repo/airdrop-base/scale"

export const calculateRequiredFee = (feeConfig: FeeConfig, amount: bigint): bigint => {
  const { feeMode } = feeConfig

  if (isFeeMode("Fixed", feeMode)) {
    return feeMode.fields[0]
  }

  if (isFeeMode("SingleTier", feeMode)) {
    const { rate, maxFee, minFee } = feeMode
    let fee = (amount * rate) / WAD_SOL
    if (fee > maxFee) fee = maxFee
    if (fee < minFee) fee = minFee
    return fee
  }

  return 0n
}
