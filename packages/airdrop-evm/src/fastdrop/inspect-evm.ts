import { createPublicClient, http, isAddress, isAddressEqual, zeroAddress, type Address, type Hash, type PublicClient } from "viem"
import { getSupportedEvmChain, getViemChain } from "@repo/chain-evm-kit/config"
import { getActive, getDynamicRecipient, getStrategies, getToken } from "../contracts/distributor/functions/reads"
import { getPenaltyConfig } from "../contracts/distributor/strategies/linear-penalty-hook/functions"
import { getStreamPreset } from "../contracts/distributor/strategies/lock-hook/functions"

function validate(condition: unknown, message: string): asserts condition {
  if (!condition) throw Object.assign(new Error(message), { name: "FastdropValidation" })
}

export async function inspectEvm(input: { chainId: string; root: Hash; roles: Record<string, string>; rpcUrl?: string }) {
  const chain = getViemChain(input.chainId)
  validate(chain, `The template does not support EVM chain ${input.chainId}.`)
  const distributor = input.roles.contract
  validate(distributor && isAddress(distributor, { strict: false }), "Invalid EVM distributor role.")
  const rpcUrl = input.rpcUrl || getSupportedEvmChain(input.chainId)?.rpcUrl
  // The template's abitype declaration widens viem's inferred account. This
  // public client is created without an account and only used for RPC reads.
  const client = createPublicClient({ transport: http(rpcUrl, { timeout: 10_000, retryCount: 0 }) }) as unknown as PublicClient
  validate(String(await client.getChainId()) === input.chainId, "RPC chainId does not match the ACS deployment.")
  const configuration = await getStrategies(client, { distributor, root: input.root })
  const [active, token, dynamicRecipient] = await Promise.all([
    getActive(client, { distributor }), getToken(client, { distributor }), getDynamicRecipient(client, { distributor }),
  ])
  validate(active, "The EVM distributor is inactive.")
  validate(!isAddressEqual(token, zeroAddress), "The EVM distributor has no token.")
  const matches = (role: string, address: Address) => {
    const candidate = input.roles[role]
    return Boolean(candidate && isAddress(candidate, { strict: false }) && isAddressEqual(candidate, address))
  }
  const strategies = configuration.strategies.map(({ hook }) => {
    if (matches("lockHook", hook)) return "lock"
    if (matches("linearPenaltyHook", hook)) return "penalty"
    if (matches("transferHook", hook) || matches("transferWithCapHook", hook)) return "transfer"
    validate(false, `Unknown EVM strategy hook: ${hook}.`)
  })
  validate(strategies.length, "The EVM root has no active strategy configuration.")
  validate(strategies.filter((strategy) => strategy === "lock").length <= 1, "Multiple lock hooks would share a stream pointer.")
  if (strategies.includes("lock")) {
    const lockHook = input.roles.lockHook as Address
    const preset = await getStreamPreset(client, { distributor, lockHook, configurationId: configuration.configurationId })
    validate(!isAddressEqual(preset.lock, zeroAddress), "The Lock hook has no stream preset for this batch.")
  }
  if (strategies.includes("penalty")) {
    const terms = await getPenaltyConfig(client, { linearPenaltyHook: input.roles.linearPenaltyHook as Address, configurationId: configuration.configurationId })
    const unset = terms.beginTime === 0n && terms.endTime === 0n
    validate(unset || terms.endTime > terms.beginTime, "The Penalty hook has no valid time window for this batch.")
  }
  return { token, strategies, dynamicRecipient }
}
