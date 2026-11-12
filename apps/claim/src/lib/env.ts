// Public campaign settings are compiled into the static browser bundle.
import { readTrimmedClientEnv as trimmed } from "@repo/shared/utils"

/** The Clique app id (clq-app-id header + ToS scope). Seeds the ACS
 *  provider + the airdrop-info identity the flow resolves everything from. */
export const appId = (): string => trimmed("VITE_APP_ID") ?? ""

/**
 * The ACS deployment NAME (mono's NEXT_PUBLIC_DEPLOYMENT, default "Distributor").
 * `useDeployment({name})` resolves it to `chainId` + `roles.contract`
 * (distributor). This is a NAME, not the deploymentId uuid — the wire
 * `deploymentId` the claim hooks need is the deployment name here (ACS keys the
 * public /deployment + /allocations reads by appId + name).
 */
export const deployment = (): string => trimmed("VITE_DEPLOYMENT") ?? "Distributor"

/**
 * ACS backend base — the public data layer (deployment / allocations / claim
 * co-sign) and the chain kit's ToS signer (`/tos_message/{appId}`) read through
 * it. Defaults to the SIT/prod ACS.
 */
export const acsApiBaseUrl = (): string =>
  trimmed("VITE_ACS_API_BASE_URL") ?? "https://acs-v4.clique.tech"

/** WalletConnect / Reown project id for AppKit. */
export const walletConnectProjectId = (): string => trimmed("VITE_WALLET_CONNECT_PROJECT_ID") ?? ""

/** Site origin (metadataBase for absolute OG URLs). */
export const domain = (): string | undefined => trimmed("VITE_DOMAIN")

/** Fastdrop binds a live site to a single reviewed ACS batch. */
export const targetBatch = (): string | undefined => trimmed("VITE_TARGET_BATCH")
