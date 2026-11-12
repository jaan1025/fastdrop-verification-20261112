import { type PublicClient, type WalletClient, type Address, type Hash } from "viem"
import { type EvmTxHandle } from "@repo/chain-evm-kit/transaction"
import { computeMerkleRoot } from "@repo/airdrop-base/distributor"
import abi from "../../abi"
import { getConsumption, getRequiredFee } from "../reads"
import { sendTransaction } from "../../../../transaction/send"

export const claim = async (
  publicClient: PublicClient,
  walletClient: WalletClient,
  params: {
    distributor: Address
    proof: Hash[]
    signature: Hash
    amount: bigint
    onBehalfOf: Address
    released: bigint
    handlerHash: Hash
    handler: string
    /** Root checked during review, when available. */
    root?: Hash
    extra?: Hash
    expectedConsumed?: bigint
    expectedFee?: bigint
  },
): Promise<EvmTxHandle> => {
  const {
    distributor,
    proof,
    signature,
    amount,
    onBehalfOf,
    released,
    handlerHash,
    handler,
    extra,
  } = params

  const root = params.root ?? computeMerkleRoot("evm", { proof, handler, amount })
  const consumed =
    (await getConsumption(publicClient, { distributor, root, handlerHash }))?.consumed ?? 0n
  if (params.expectedConsumed !== undefined && consumed !== params.expectedConsumed) {
    throw new Error("The consumed amount changed. Prepare a new claim.")
  }
  // The distributor charges this fee only on the first claim.
  const fee =
    consumed === 0n ? await getRequiredFee(publicClient, { distributor, root, amount }) : 0n
  if (params.expectedFee !== undefined && fee !== params.expectedFee) {
    throw new Error("The claim fee changed. Prepare a new claim.")
  }

  const args = [
    proof,
    signature,
    amount,
    released,
    handlerHash,
    onBehalfOf,
    (extra ?? "0x") as Hash,
  ] as const

  return sendTransaction({
    write: async () => {
      const { request } = await publicClient.simulateContract({
        address: distributor,
        abi,
        functionName: "claim",
        args,
        value: fee,
        account: walletClient.account!,
      })
      return walletClient.writeContract(request)
    },
    account: walletClient.account!.address,
    publicClient,
  })
}
