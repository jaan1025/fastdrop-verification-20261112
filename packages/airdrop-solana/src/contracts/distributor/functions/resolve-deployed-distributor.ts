import { type Address, type Rpc, type SolanaRpcApi } from "@solana/kit"
import { getDistributorPDA } from "./pda"
import { fetchMaybeMerkleDistributor } from "../generated/accounts/merkleDistributor"

/**
 * If a distributor for `base` (the projectAdmin) already exists on-chain, return
 * its PDA address; otherwise `undefined`.
 *
 * The distributor PDA is deterministic from `base` alone (seeds
 * `["MerkleDistributor", base]`) and `NewDistributor` is NOT idempotent —
 * re-deploying an existing distributor fails with `already in use`. A deploy tx
 * can land on-chain while its address is never recorded in `app_conf` (the
 * deploy's finalized-preflight first-fail forces a retry whose response is lost,
 * or the confirm / write-config step is interrupted). Without this check the
 * draft bricks into a permanent re-deploy-and-fail loop.
 *
 * Callers run this before deploying: if it resolves, record the address instead
 * of re-deploying. Read at `confirmed` so a just-landed distributor is detected
 * before a re-deploy would collide.
 */
export const resolveDeployedDistributor = async (params: {
  rpc: Rpc<SolanaRpcApi>
  /** projectAdmin / base — the sole distributor PDA seed. */
  base: string
}): Promise<string | undefined> => {
  const [pda] = await getDistributorPDA(params.base as Address)
  const maybe = await fetchMaybeMerkleDistributor(params.rpc, pda, {
    commitment: "confirmed",
  })
  return maybe.exists ? pda : undefined
}
