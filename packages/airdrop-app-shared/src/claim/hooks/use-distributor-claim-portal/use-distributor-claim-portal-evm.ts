"use client"
import { isAddress, type Address, type Hash, type PublicClient } from "viem"
import { useAccount, useConfig, usePublicClient as useViemPublicClient } from "wagmi"
import { getAccount, getWalletClient } from "wagmi/actions"
import {
  buildEvmClaimExtra,
  confirmTransaction,
  distributorAbi,
  distributorClaim,
  evmPenaltyTerms,
  getActive,
  getConsumption,
  getDynamicRecipient,
  getPenaltyConfig,
  getRequiredFee,
  getStrategies,
  getStreamPreset,
  getToken,
  getVault,
  resolveKnownHookType,
  STRATEGY_KIND_BY_HOOK_TYPE,
  type HookContracts,
} from "@repo/airdrop-evm/contracts"
import { usePreflight, useEnsureToSSigned } from "@repo/chain-evm-kit/react"
import { usePublicClient as useAcsPublicClient } from "@repo/acs-client/react"
import { addressesMatch } from "@repo/acs-client/model"
import {
  computeMerkleRootFromHandlerHash,
  deriveHandlerHash,
  type Configuration,
} from "@repo/airdrop-base/distributor"
import { usePersistFn } from "@repo/shared/hooks"
import { type DistributorClaimPortalResult } from "../claim-hook-result"
import {
  assertCampaignRoot,
  claimReviewKey,
  evaluatePortalDelivery,
  prepareClaimReview,
  readPortalAllocation,
  resolveClaimRelease,
  REVIEW_MAX_AGE_SECONDS,
} from "./portal-claim-review"

export interface UseDistributorClaimPortalEvmParams {
  organizationId: string
  projectId: string
  chainId: string
  distributor: Address | undefined
  hookContracts: HookContracts
  batch: string
  expectedRoot?: Hash
  /** On-chain recipient used by the app's stream lookup and this self-sign claim. */
  recipientAddress: string
}

async function readConfiguration(
  client: PublicClient,
  distributor: Address,
  root: Hash,
  hookContracts: HookContracts,
  knownDynamicRecipient?: boolean,
) {
  const target = { distributor, root }
  const [
    { strategies, fallbackHook, configurationId },
    active,
    token,
    vault,
    dynamicRecipient,
    signer,
  ] = await Promise.all([
    getStrategies(client, target),
    getActive(client, target),
    getToken(client, target),
    getVault(client, target),
    knownDynamicRecipient ?? getDynamicRecipient(client, target),
    client.readContract({ address: distributor, abi: distributorAbi, functionName: "signer" }),
  ])
  if (!active) throw new Error("The distributor is paused.")
  const typedStrategies = strategies.map(({ hook, proportion }) => {
    const hookType = resolveKnownHookType(hook, hookContracts)
    if (!hookType || hookType === "transfer-or-coin-flip") {
      throw new Error(`Unsupported claim hook: ${hook}.`)
    }
    return { hook, hookType, proportion }
  })
  const penaltyHook = typedStrategies.find((strategy) => strategy.hookType === "linear-penalty")
  const lockHook = typedStrategies.find((strategy) => strategy.hookType === "lock")
  const [penaltyConfig, streamPreset] = await Promise.all([
    penaltyHook &&
      getPenaltyConfig(client, { linearPenaltyHook: penaltyHook.hook, configurationId }),
    lockHook && getStreamPreset(client, { lockHook: lockHook.hook, distributor, configurationId }),
  ])
  if (lockHook && !streamPreset?.startTime) throw new Error("Stream preset not found on-chain.")
  const configuration: Configuration = {
    chainKind: "evm",
    fallbackIndex: Number(fallbackHook),
    strategies: typedStrategies.map(({ hookType, proportion }) => ({
      kind: STRATEGY_KIND_BY_HOOK_TYPE[hookType],
      proportion,
      penalty:
        hookType === "linear-penalty" && penaltyConfig ? evmPenaltyTerms(penaltyConfig) : undefined,
    })),
  }
  return {
    configuration,
    typedStrategies,
    hasPenalty: !!penaltyHook,
    revision: claimReviewKey({
      token,
      vault,
      signer,
      dynamicRecipient,
      configurationId,
      fallbackHook,
      typedStrategies,
      penaltyConfig,
      streamPreset,
    }),
  }
}

export function useDistributorClaimPortalEvm(
  params: UseDistributorClaimPortalEvmParams,
): DistributorClaimPortalResult {
  const client = useAcsPublicClient()
  const { address } = useAccount()
  const evmChainId = Number(params.chainId)
  const publicClient = useViemPublicClient({ chainId: evmChainId })
  const config = useConfig()
  const { preflight } = usePreflight({ chainId: evmChainId })
  const { ensureToSSigned } = useEnsureToSSigned({
    appId: params.organizationId,
    chainId: evmChainId,
  })
  const targetKey = claimReviewKey(params)
  const getCurrentTarget = usePersistFn(() => targetKey)

  const prepareClaim = async () => {
    const { distributor, hookContracts, batch, projectId, expectedRoot, recipientAddress } = params
    if (!publicClient || !distributor) throw new Error("Distributor unavailable.")
    if (!isAddress(recipientAddress)) throw new Error("Invalid claim recipient.")
    const account = getAccount(config)
    const { address: walletAddress, connector } = account
    if (!walletAddress || !connector || account.chainId !== evmChainId) {
      throw new Error("Connect a wallet on the campaign chain.")
    }
    if (!addressesMatch("evm", walletAddress, recipientAddress)) {
      throw new Error("Connect the wallet that matches the allocation recipient.")
    }
    const assertWallet = () => {
      const current = getAccount(config)
      if (
        getCurrentTarget() !== targetKey ||
        current.chainId !== evmChainId ||
        current.connector?.uid !== connector.uid ||
        !addressesMatch("evm", current.address, walletAddress)
      ) {
        throw new Error("The wallet or campaign changed. Prepare a new claim.")
      }
    }

    const tosSignature = await ensureToSSigned()
    assertWallet()
    const allocationScope = {
      batch,
      address: walletAddress,
      deploymentId: projectId,
      chainKind: "evm",
      amountBits: 256,
    } as const
    const [allocationData, dynamicRecipient] = await Promise.all([
      readPortalAllocation(client, allocationScope),
      getDynamicRecipient(publicClient, { distributor }),
    ])
    const { allocation, addressHandler, proof } = allocationData
    const handlerHash = deriveHandlerHash(addressHandler, dynamicRecipient)
    const root = computeMerkleRootFromHandlerHash("evm", { proof, handlerHash, amount: allocation })
    assertCampaignRoot(root, expectedRoot)

    const scope = {
      batch,
      addressHandler,
      dynamicRecipient,
      sig: tosSignature,
      deploymentId: projectId,
    }
    const readConsumed = async () =>
      (await getConsumption(publicClient, { distributor, root, handlerHash }))?.consumed ?? 0n
    const [release, snapshot] = await Promise.all([
      resolveClaimRelease({ client, scope, allocation, readConsumed }),
      readConfiguration(publicClient, distributor, root, hookContracts, dynamicRecipient),
    ])
    const readFee = () =>
      release.consumed === 0n
        ? getRequiredFee(publicClient, { distributor, root, amount: allocation })
        : Promise.resolve(0n)
    const [fee, { timestamp: claimAt }] = await Promise.all([readFee(), publicClient.getBlock()])
    const { delivery, byStrategy } = evaluatePortalDelivery(
      snapshot.configuration,
      release,
      claimAt,
    )
    const extra = buildEvmClaimExtra({
      configurationIndex: 0,
      strategies: snapshot.typedStrategies.map((strategy, i) => ({
        ...strategy,
        consumed: byStrategy[i]!.consumed,
      })),
      fallbackHook: snapshot.configuration.fallbackIndex,
      claimable: release.claimable,
      claimAt,
    })
    assertWallet()

    return prepareClaimReview({
      client,
      scope,
      release,
      delivery,
      extra,
      beforeCoSign: async () => {
        assertWallet()
        const currentAllocation = await readPortalAllocation(client, allocationScope)
        if (claimReviewKey(currentAllocation) !== claimReviewKey(allocationData)) {
          throw new Error("The allocation changed. Prepare a new claim.")
        }
        assertWallet()
      },
      validate: async () => {
        const [consumed, current, currentFee, block] = await Promise.all([
          readConsumed(),
          readConfiguration(publicClient, distributor, root, hookContracts),
          readFee(),
          snapshot.hasPenalty ? publicClient.getBlock() : undefined,
        ])
        if (consumed !== release.consumed) {
          throw new Error("The consumed amount changed. Prepare a new claim.")
        }
        if (current.revision !== snapshot.revision || currentFee !== fee) {
          throw new Error("The on-chain configuration changed. Prepare a new claim.")
        }
        if (
          block &&
          (block.timestamp < claimAt || block.timestamp > claimAt + REVIEW_MAX_AGE_SECONDS)
        ) {
          throw new Error("The penalty quote expired. Prepare a new claim.")
        }
        assertWallet()
        const wallet = await getWalletClient(config, { chainId: evmChainId })
        assertWallet()
        if (!addressesMatch("evm", wallet.account.address, walletAddress)) {
          throw new Error("The wallet changed. Prepare a new claim.")
        }
        return wallet
      },
      send: async (signature, wallet) => {
        const handle = await distributorClaim(publicClient, wallet, {
          distributor,
          proof,
          signature,
          amount: allocation,
          released: release.released,
          handlerHash,
          handler: addressHandler,
          root,
          onBehalfOf: recipientAddress,
          extra,
          expectedConsumed: release.consumed,
          expectedFee: fee,
        })
        const receipt = await confirmTransaction(handle, { publicClient })
        return receipt.transactionHash
      },
    })
  }

  return {
    chainKind: "evm",
    preflight: async () => {
      const { address: connected } = await preflight()
      return { address: connected }
    },
    prepareClaim,
    runClaim: async () => (await prepareClaim()).submit(),
    connectedAddress: address,
  }
}
