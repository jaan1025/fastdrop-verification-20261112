import { splitScheduleCode } from "./allocation"

/**
 * A batch's `configuration` is one or more schedule codes joined by ":" —
 * multi-schedule batches read like `"052c08:2a473a"`. `nameByCode` maps each
 * *individual* schedule code to its display name, so a compound configuration
 * never matches a map key directly (which is why multi-schedule codes used to
 * show no name on hover). Resolve a possibly-compound code to a single human
 * label by joining each segment's display name.
 *
 * Returns `undefined` when no segment resolves to a name, so callers fall back
 * to "no tooltip" exactly like an unknown single code.
 */
export function resolveScheduleName(
  configuration: string,
  nameByCode: Record<string, string>,
): string | undefined {
  const codes = splitScheduleCode(configuration)
  if (codes.length === 0) return undefined
  // Single code: direct lookup — preserves prior behaviour exactly.
  if (codes.length === 1) return nameByCode[codes[0]]
  // Compound: at least one segment must be known, else there's nothing to show.
  if (codes.every((code) => nameByCode[code] === undefined)) return undefined
  // Keep the label complete: fall back to the raw segment code for any segment
  // without a friendly name.
  return codes.map((code) => nameByCode[code] ?? code).join(" · ")
}
