import type { Deployment } from "./types/app-conf"

/** The two product kinds a deployment can be (mirrors `DeploymentExtra.type`). */
export type DeploymentProduct = "airdrop" | "vesting"

/**
 * Resolve a deployment's product. `DeploymentExtra.type` is the ONLY product
 * discriminator: newly-created projects stamp it ('airdrop' | 'vesting'); legacy
 * deployments predate the field. The product-scope convention is
 * `type !== "vesting"` ⇒ airdrop, so an unset type resolves to airdrop. There is
 * no third product — every deployment resolves to exactly one.
 *
 * Caveat: a legacy *vesting* deployment created before type-stamping (unset type)
 * resolves here as 'airdrop' — exactly as the airdrop console scopes it.
 */
export const resolveDeploymentProduct = (d: Pick<Deployment, "extra">): DeploymentProduct =>
  d.extra.type === "vesting" ? "vesting" : "airdrop"

/** Airdrop scope predicate: everything not explicitly `"vesting"` (legacy-untyped included). */
export const isAirdropDeployment = (d: Pick<Deployment, "extra">): boolean =>
  resolveDeploymentProduct(d) === "airdrop"

/** Vesting scope predicate: only explicitly-typed `"vesting"` deployments. */
export const isVestingDeployment = (d: Pick<Deployment, "extra">): boolean =>
  resolveDeploymentProduct(d) === "vesting"
