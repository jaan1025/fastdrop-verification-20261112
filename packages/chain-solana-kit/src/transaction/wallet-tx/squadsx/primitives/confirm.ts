import {
  type Rpc,
  type SolanaRpcApi,
  type RpcSubscriptions,
  type SolanaRpcSubscriptionsApi,
  type Signature,
} from "@solana/kit"
import { confirm as confirmSignature } from "../../../confirm"
import { waitForExecution } from "./execution"

/**
 * SquadsX confirm primitive: poll `waitForExecution` until the proposal
 * executes, then confirm the execution transaction to finality and return its
 * signature. Composed from the poll primitive + the generic finality `confirm`
 * — the handle-level `../confirm.ts` is a thin adapter over this. Parallel to
 * the EVM kit's `safe/confirm.ts`.
 */
export const confirm = async (params: {
  rpc: Rpc<SolanaRpcApi>
  rpcSubscriptions?: RpcSubscriptions<SolanaRpcSubscriptionsApi>
  proposalSignature: string
}): Promise<string> => {
  const { rpc, rpcSubscriptions, proposalSignature } = params

  const executionSignature = await waitForExecution({
    rpc,
    proposalSignature,
  })
  await confirmSignature({
    rpc,
    rpcSubscriptions,
    txSignature: executionSignature as Signature,
  })
  return executionSignature
}
