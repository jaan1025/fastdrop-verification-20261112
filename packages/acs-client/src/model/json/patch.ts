import type { JsonPatchOp } from "../types/json-patch"

/**
 * Unified constructor for the common JSON-Patch ops, so callers stop hand-writing
 * `{ op: 'add', path, value }` (and can't typo the `op` field). Overloaded so
 * `add`/`replace` require a `value` and `remove` forbids it. Compose with a
 * domain path builder, e.g. `patchOp('add', batchRootPath(dep, batch, 'status'), v)`.
 */
export function patchOp(kind: "add" | "replace", path: string, value: unknown): JsonPatchOp
export function patchOp(kind: "remove", path: string): JsonPatchOp
export function patchOp(
  kind: "add" | "replace" | "remove",
  path: string,
  value?: unknown,
): JsonPatchOp {
  return kind === "remove" ? { op: "remove", path } : { op: kind, path, value }
}
