import { escapeJsonPointerSegment } from "./pointer"

/**
 * Build a JSON-Patch path into
 * `app_conf.deployments[<dep>].extra.root[<batch>][<suffix>]`. Escapes the
 * deployment + batch segments; `suffix` is a pre-built tail like `status`,
 * `configuration`, `root` — caller is responsible for the suffix not needing
 * escape (it's a known field name).
 */
export function batchRootPath(deploymentId: string, batchName: string, suffix: string): string {
  return `/deployments/${escapeJsonPointerSegment(deploymentId)}/extra/root/${escapeJsonPointerSegment(batchName)}/${suffix}`
}
