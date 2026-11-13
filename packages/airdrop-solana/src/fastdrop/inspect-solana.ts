import { address, createDefaultRpcTransport, createSolanaRpcFromTransport } from "@solana/kit"
import { clusterFromChainId } from "@repo/chain-solana-kit/config"
import { hexToBytes } from "@repo/shared/utils"
import { LOCK_HOOK_ACCOUNT_COUNT } from "../contracts/distributor/strategies/lock/lock-hook-accounts"
import { HookType } from "../contracts/distributor/generated/types/hookType"
import { fetchMerkleDistributor, fetchPenaltyConfig, fetchStreamPreset } from "../contracts/distributor/functions/fetch"
import { getClaimRootPDA, getDistributorPDA, getPenaltyConfigPDA, getStreamPresetPDA } from "../contracts/distributor/functions/pda"
import { resolveConfigurators } from "../contracts/distributor/functions/configurator"
import { CLIQUE_LOCK_PROGRAM_ADDRESS } from "../contracts/lock/generated/programs/cliqueLock"

function validate(condition: unknown, message: string): asserts condition {
  if (!condition) throw Object.assign(new Error(message), { name: "FastdropValidation" })
}

export async function inspectSolana(input: { chainId: string; root?: `0x${string}`; roles: Record<string, string>; rpcUrl?: string; signal?: AbortSignal }) {
  const cluster = clusterFromChainId(input.chainId)
  validate(cluster, `The template does not support Solana cluster ${input.chainId}.`)
  const configuredRpc = input.rpcUrl
  validate(cluster !== "localnet" || configuredRpc, "Set FASTDROP_RPC_URL to the local Solana RPC.")
  const official = cluster === "localnet" ? undefined : `https://api.${cluster}.solana.com`
  const deadline = input.signal ? AbortSignal.any([input.signal, AbortSignal.timeout(45_000)]) : AbortSignal.timeout(45_000)
  const createRpc = (url: string) => {
    const transport = createDefaultRpcTransport({ url })
    return createSolanaRpcFromTransport((request) => transport({
      ...request,
      signal: request.signal ? AbortSignal.any([request.signal, deadline]) : deadline,
    }))
  }
  const rpc = createRpc(configuredRpc || official!)
  if (configuredRpc && official && configuredRpc !== official) {
    const [actual, expected] = await Promise.all([rpc.getGenesisHash().send(), createRpc(official).getGenesisHash().send()])
    validate(actual === expected, "RPC cluster does not match the ACS Solana deployment.")
  }
  const role = address(input.roles.contract!)
  const direct = await fetchMerkleDistributor(rpc, role)
  // Current ACS projects store the distributor PDA; older portals used its seed.
  const distributorPda = direct ? role : (await getDistributorPDA(role))[0]
  const distributor = direct ?? await fetchMerkleDistributor(rpc, distributorPda)
  validate(distributor, "The Solana distributor account is missing.")
  const [expectedPda] = await getDistributorPDA(distributor.base)
  validate(expectedPda === distributorPda, "The Solana distributor address does not match its on-chain base.")
  validate(distributor.active, "The Solana distributor is inactive.")
  if (!input.root) return { token: distributor.mint, strategies: [], dynamicRecipient: distributor.dynamicRecipient, solanaBase: distributor.base }
  const [claimRootPda] = await getClaimRootPDA({ distributor: distributorPda, root: hexToBytes(input.root) })
  const configurators = await resolveConfigurators(rpc, distributorPda, claimRootPda)
  const config = configurators.find(({ index }) => index === 0)
  validate(config, "The Solana batch configuration is missing.")
  const strategies = config.strategies.map(({ hookType, accountsCount }) => {
    if (hookType === HookType.Transfer) {
      validate(accountsCount === 0, "Unexpected Transfer account count.")
      return "transfer"
    }
    if (hookType === HookType.Lock) {
      validate(accountsCount === LOCK_HOOK_ACCOUNT_COUNT, "Unexpected Lock account count.")
      return "lock"
    }
    if (hookType === HookType.Penalty) {
      validate(accountsCount === 1, "Unexpected Penalty account count.")
      return "penalty"
    }
    validate(false, "Unknown Solana strategy hook.")
  })
  validate(strategies.length && config.fallbackHook < strategies.length, "The Solana root has no valid strategy configuration.")
  validate(strategies.filter((strategy) => strategy === "lock").length <= 1, "Multiple lock hooks would share a stream address.")
  const parameters = { distributor: distributorPda, configurator: config.configurator }
  if (strategies.includes("lock")) {
    const [preset] = await getStreamPresetPDA(parameters)
    const schedule = await fetchStreamPreset(rpc, preset)
    validate(schedule, "The Solana Lock hook has no stream preset for this batch.")
    validate(schedule.lockProgram === CLIQUE_LOCK_PROGRAM_ADDRESS, "The Solana Lock hook uses an unsupported lock program.")
  }
  if (strategies.includes("penalty")) {
    const [terms] = await getPenaltyConfigPDA(parameters)
    validate(await fetchPenaltyConfig(rpc, terms), "The Solana Penalty configuration is missing.")
  }
  return { token: distributor.mint, strategies, dynamicRecipient: distributor.dynamicRecipient, solanaBase: distributor.base }
}
