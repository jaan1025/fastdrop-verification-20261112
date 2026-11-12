import { escapeJsonPointerSegment } from "./pointer"

/**
 * Build a JSON-Patch path into
 * `app_conf.deployments[<dep>].extra.configurations[<code>][/suffix]`.
 *
 * Analogue of `batchRootPath`, but pointing at the `configurations` map instead
 * of `root`. The deployment id and the configuration code are user/wire-supplied
 * and are escaped per RFC 6901; `suffix` is a pre-built, escape-free tail (a
 * known field name like `displayName`, `strategy`, `fallbackIdx`) and is
 * appended verbatim.
 */
export function configurationsPath(deploymentId: string, code: string, suffix?: string): string {
  const base = `/deployments/${escapeJsonPointerSegment(deploymentId)}/extra/configurations/${escapeJsonPointerSegment(code)}`
  return suffix ? `${base}/${suffix}` : base
}
