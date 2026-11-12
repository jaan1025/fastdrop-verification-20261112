import type { AcsClient } from "../../../transport"
import { postRelay } from "./post-relay"
import type { FeeMode } from "../../../model"

// Wire format: backend's `FeeMode` enum has `rename_all = "camelCase"` on the
// variants, but the inner struct fields of `SingleTierFeeRate` are NOT renamed
// (serde only renames variants on an enum, not the nested struct's fields).
// Colocated per-endpoint transform (M2). Fee VALUES are already integer-scaled by
// the kit's fee codec — this only does field-name shaping, not scaling.
const toWireFeeMode = (mode: FeeMode): unknown => {
  if ("fixedFee" in mode) return mode
  const { feeRate, minFee, maxFee } = mode.singleTierFeeRate
  return {
    singleTierFeeRate: {
      fee_rate: feeRate,
      min_fee: minFee,
      max_fee: maxFee,
    },
  }
}

export interface SetFeeParams {
  projectAdmin: string
  batchRoot: `0x${string}`
  feeMode: FeeMode
  deploymentId?: string
}

export const setFee = (client: AcsClient, params: SetFeeParams) => {
  // Shape the wire fee mode first, then hand the relay envelope to postRelay.
  // Key order (projectAdmin, batchRoot, feeMode) is byte-critical — it becomes
  // the `...rest` spread after postRelay strips `deploymentId`.
  const relayParams = {
    projectAdmin: params.projectAdmin,
    batchRoot: params.batchRoot,
    feeMode: toWireFeeMode(params.feeMode),
    deploymentId: params.deploymentId,
  }
  return postRelay<{ txHash: `0x${string}` }>(
    client,
    "/admin/relay/distributor/set-fee",
    relayParams,
    "setFee",
  )
}
