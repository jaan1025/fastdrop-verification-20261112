import type { AcsClient } from "../../transport"
import { requireAppId, requireDeployment } from "../../transport"
import { normalizeEvmAddress } from "../../model"
import type {
  GetClaimDataParams,
  PaymasterClaimParams,
  QuoteClaimDataParams,
} from "../claim-payload"

const claimHandlerKey = ({ addressHandler, dynamicRecipient }: QuoteClaimDataParams): string =>
  dynamicRecipient ? addressHandler : normalizeEvmAddress(addressHandler)

export const quoteClaimData = async (client: AcsClient, params: QuoteClaimDataParams) => {
  const deployment = requireDeployment(client, params.deploymentId, "quoteClaimData")
  const { released } = await client.request<{ released: string }>("/claim", {
    method: "POST",
    body: {
      appId: requireAppId(client, "quoteClaimData"),
      deployment,
      batch: params.batch,
      addressHandler: claimHandlerKey(params),
      sig: params.sig,
      ...(params.walletSet !== undefined ? { walletSet: params.walletSet } : {}),
    },
  })
  return { released }
}

export const getClaimData = (client: AcsClient, params: GetClaimDataParams) => {
  const deployment = requireDeployment(client, params.deploymentId, "getClaimData")
  const { deploymentId: _deploymentId, dynamicRecipient: _dynamicRecipient, ...rest } = params
  return client.request<{ sig: `0x${string}` | null; released: string } & Record<string, unknown>>(
    "/claim",
    {
      method: "POST",
      body: {
        appId: requireAppId(client, "getClaimData"),
        deployment,
        ...rest,
        addressHandler: claimHandlerKey(params),
      },
    },
  )
}

export const paymasterClaim = (client: AcsClient, params: PaymasterClaimParams) => {
  const deployment = requireDeployment(client, params.deploymentId, "paymasterClaim")
  const { deploymentId: _deploymentId, ...rest } = params
  return client.request<{ txHash: string }>("/relay/claim", {
    method: "POST",
    body: { appId: requireAppId(client, "paymasterClaim"), deployment, ...rest },
  })
}
