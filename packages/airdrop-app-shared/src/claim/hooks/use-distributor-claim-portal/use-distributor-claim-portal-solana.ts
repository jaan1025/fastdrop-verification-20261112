"use client"
import {
  solanaChainFromChainId,
  type Address as SolAddress,
  type Rpc,
  type SolanaRpcApi,
} from "@repo/chain-solana-kit/config"
import {
  usePreflight,
  useSolana,
  useSolanaReadClients,
  useWalletSigners,
} from "@repo/chain-solana-kit/react"
import { useEnsureToSSigned } from "@repo/chain-solana-kit/tos-signer"
import {
  buildClaimExtra,
  confirmTransaction,
  distributorClaim,
  fetchBatchConfig,
  fetchClaimRoot,
  fetchFeeConfig,
  fetchMerkleDistributor,
  fetchPenaltyConfig,
  fetchStreamPreset,
  getBatchConfigPDA,
  getClaimRootPDA,
  getClaimStatus,
  getDistributorPDA,
  getFeeConfigPDA,
  getPenaltyConfigPDA,
  getStreamPresetPDA,
  HookType,
  solanaPenaltyTerms,
  STRATEGY_KIND_BY_HOOK_TYPE,
} from "@repo/airdrop-solana/contracts"
import { usePublicClient as useAcsPublicClient } from "@repo/acs-client/react"
import {
  computeMerkleRootFromHandlerHash,
  deriveSolanaHandlerHash,
  type Configuration,
} from "@repo/airdrop-base/distributor"
import { usePersistFn } from "@repo/shared/hooks"
import { bytesToHex, hexToBytes } from "@repo/shared/utils"
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

export interface UseDistributorClaimPortalSolanaParams {
  chainId: string | undefined
  organizationId: string
  projectId: string
  base: SolAddress | undefined
  batch: string
  expectedRoot?: `0x${string}`
  /** Shared project LUT, if configured. */
  commonLutAddress?: SolAddress
}

async function readConfiguration(
  rpc: Rpc<SolanaRpcApi>,
  distributorPda: SolAddress,
  claimRootPda: SolAddress,
  rootBytes: Uint8Array,
  knownDistributor?: NonNullable<Awaited<ReturnType<typeof fetchMerkleDistributor>>>,
) {
  const [[feeConfigPda], distributor, claimRoot] = await Promise.all([
    getFeeConfigPDA({ distributor: distributorPda, root: rootBytes }),
    knownDistributor ?? fetchMerkleDistributor(rpc, distributorPda),
    fetchClaimRoot(rpc, claimRootPda),
  ])
  if (!distributor?.active) throw new Error("The distributor is unavailable or paused.")
  if (
    !claimRoot?.configurators[0] ||
    claimRoot.distributor !== distributorPda ||
    bytesToHex(Uint8Array.from(claimRoot.root)) !== bytesToHex(rootBytes)
  ) {
    throw new Error("Claim root or configuration not found on-chain.")
  }
  const configurator = Uint8Array.from(claimRoot.configurators[0])
  const seed = { distributor: distributorPda, configurator }
  const [batchConfigPda] = await getBatchConfigPDA(seed)
  const [batchConfig, feeConfig] = await Promise.all([
    fetchBatchConfig(rpc, batchConfigPda),
    fetchFeeConfig(rpc, feeConfigPda),
  ])
  if (!batchConfig || !feeConfig) throw new Error("Batch or fee configuration not found on-chain.")
  const { strategies, fallbackHook } = batchConfig
  const hasPenalty = strategies.some(({ hookType }) => hookType === HookType.Penalty)
  const hasLock = strategies.some(({ hookType }) => hookType === HookType.Lock)
  const [penaltyConfig, streamPreset] = await Promise.all([
    hasPenalty && getPenaltyConfigPDA(seed).then(([pda]) => fetchPenaltyConfig(rpc, pda)),
    hasLock && getStreamPresetPDA(seed).then(([pda]) => fetchStreamPreset(rpc, pda)),
  ])
  if (hasLock && !streamPreset) throw new Error("Stream preset not found on-chain.")
  const configuration: Configuration = {
    chainKind: "solana",
    fallbackIndex: fallbackHook,
    strategies: strategies.map(({ hookType, proportion }) => {
      const kind = STRATEGY_KIND_BY_HOOK_TYPE[hookType]
      if (!kind) throw new Error(`Unsupported claim hook: ${hookType}.`)
      return {
        kind,
        proportion,
        penalty:
          hookType === HookType.Penalty && penaltyConfig
            ? solanaPenaltyTerms(penaltyConfig)
            : undefined,
      }
    }),
  }
  return {
    configurator,
    batchConfigPda,
    configuration,
    strategies,
    hasPenalty,
    revision: claimReviewKey({
      distributor,
      configurator,
      batchConfig,
      feeConfig,
      penaltyConfig,
      streamPreset,
    }),
  }
}

async function readChainTime(rpc: Rpc<SolanaRpcApi>): Promise<bigint> {
  const slot = await rpc.getSlot({ commitment: "confirmed" }).send()
  const timestamp = await rpc.getBlockTime(slot).send()
  if (timestamp === null) throw new Error("Could not read the on-chain claim time.")
  return BigInt(timestamp)
}

export function useDistributorClaimPortalSolana(
  params: UseDistributorClaimPortalSolanaParams,
): DistributorClaimPortalResult {
  const client = useAcsPublicClient()
  const campaignChain = solanaChainFromChainId(params.chainId)
  const { rpc, ws } = useSolanaReadClients(campaignChain)
  const { chain, isConnected, selectedAccount, selectedWallet, wallets } = useSolana()
  const { getTransactionSigner } = useWalletSigners()
  const { ensureToSSigned } = useEnsureToSSigned()
  const { preflight } = usePreflight()
  const targetKey = claimReviewKey(params)
  const getCurrentWallet = usePersistFn(() => {
    if (!isConnected || !selectedAccount || !selectedWallet || chain !== campaignChain) return
    const wallet = wallets.find((item) => item.name === selectedWallet.name)
    if (!wallet?.accounts.some(({ address }) => address === selectedAccount.address)) return
    return { targetKey, wallet, address: selectedAccount.address, payer: getTransactionSigner() }
  })

  const prepareClaim = async () => {
    const { base, projectId, batch, expectedRoot, commonLutAddress } = params
    if (!rpc || !base || !campaignChain) throw new Error("Distributor unavailable.")
    const { wallet, account } = await preflight()
    const recipient = account.address as SolAddress
    const getReviewedWallet = () => {
      const current = getCurrentWallet()
      if (
        !current ||
        current.targetKey !== targetKey ||
        current.address !== recipient ||
        current.wallet.name !== wallet.name ||
        current.payer?.address !== recipient
      ) {
        throw new Error("The wallet or campaign changed. Prepare a new claim.")
      }
      return { payer: current.payer, wallet: current.wallet }
    }
    getReviewedWallet()
    const tosSignature = await ensureToSSigned()
    getReviewedWallet()
    const allocationScope = {
      batch,
      address: recipient,
      deploymentId: projectId,
      chainKind: "solana",
      amountBits: 64,
    } as const
    const [distributorPda] = await getDistributorPDA(base)
    const [allocationData, distributor] = await Promise.all([
      readPortalAllocation(client, allocationScope),
      fetchMerkleDistributor(rpc, distributorPda),
    ])
    if (!distributor?.active) throw new Error("The distributor is unavailable or paused.")
    const { dynamicRecipient } = distributor
    const { allocation, addressHandler, proof } = allocationData
    const handlerHash = deriveSolanaHandlerHash(addressHandler, dynamicRecipient)
    const root = computeMerkleRootFromHandlerHash("solana", {
      proof,
      handlerHash,
      amount: allocation,
    })
    assertCampaignRoot(root, expectedRoot)
    const rootBytes = hexToBytes(root)
    const handler = hexToBytes(handlerHash)
    const [claimRootPda] = await getClaimRootPDA({ distributor: distributorPda, root: rootBytes })

    const scope = {
      batch,
      addressHandler,
      dynamicRecipient,
      sig: tosSignature,
      deploymentId: projectId,
    }
    const readConsumed = async () =>
      (await getClaimStatus(rpc, { distributor: distributorPda, claimRoot: claimRootPda, handler }))
        ?.claimed ?? 0n
    const [release, snapshot] = await Promise.all([
      resolveClaimRelease({ client, scope, allocation, readConsumed }),
      readConfiguration(rpc, distributorPda, claimRootPda, rootBytes, distributor),
    ])
    const claimAt = snapshot.hasPenalty
      ? await readChainTime(rpc)
      : BigInt(Math.floor(Date.now() / 1000))
    const { delivery, byStrategy } = evaluatePortalDelivery(
      snapshot.configuration,
      release,
      claimAt,
    )
    const extra = buildClaimExtra({
      configuratorIndex: 0,
      strategies: snapshot.strategies.map((strategy, i) => ({
        ...strategy,
        consumed: byStrategy[i]!.consumed,
      })),
      fallbackHook: snapshot.configuration.fallbackIndex,
      claimable: release.claimable,
      claimAt,
    })
    getReviewedWallet()

    return prepareClaimReview({
      client,
      scope,
      release,
      delivery,
      extra: bytesToHex(extra),
      beforeCoSign: async () => {
        getReviewedWallet()
        const currentAllocation = await readPortalAllocation(client, allocationScope)
        if (claimReviewKey(currentAllocation) !== claimReviewKey(allocationData)) {
          throw new Error("The allocation changed. Prepare a new claim.")
        }
        getReviewedWallet()
      },
      validate: async () => {
        const [consumed, current, currentTime] = await Promise.all([
          readConsumed(),
          readConfiguration(rpc, distributorPda, claimRootPda, rootBytes),
          snapshot.hasPenalty ? readChainTime(rpc) : undefined,
        ])
        if (consumed !== release.consumed) {
          throw new Error("The consumed amount changed. Prepare a new claim.")
        }
        if (current.revision !== snapshot.revision) {
          throw new Error("The on-chain configuration changed. Prepare a new claim.")
        }
        if (
          currentTime !== undefined &&
          (currentTime < claimAt - REVIEW_MAX_AGE_SECONDS ||
            currentTime > claimAt + REVIEW_MAX_AGE_SECONDS)
        ) {
          throw new Error("The penalty quote expired. Prepare a new claim.")
        }
        return getReviewedWallet()
      },
      send: async (signature, reviewedWallet) => {
        const handle = await distributorClaim({
          rpc,
          ws,
          ...reviewedWallet,
          recipient,
          base,
          handler,
          root: rootBytes,
          configurator: snapshot.configurator,
          distributorPda,
          claimRootPda,
          batchConfigPda: snapshot.batchConfigPda,
          amount: allocation,
          released: release.released,
          proof,
          sig: signature,
          extra,
          commonLutAddress,
          allowCreateLut: false,
        })
        return confirmTransaction(handle, { rpc, rpcSubscriptions: ws })
      },
    })
  }

  return {
    chainKind: "solana",
    preflight: async () => {
      const { account } = await preflight()
      return { address: account.address }
    },
    prepareClaim,
    runClaim: async () => (await prepareClaim()).submit(),
    connectedAddress: selectedAccount?.address,
  }
}
