// Pure type-guard predicates. Faithful in-repo ports of the es-toolkit predicates
// the codebase used (`isNil`, `isPlainObject`), vendored here so `@repo/shared`
// carries no es-toolkit dependency. Zero runtime deps.

/** `true` for `null` or `undefined` (and nothing else). Mirrors es-toolkit `isNil`. */
export const isNil = (value: unknown): value is null | undefined => value == null

/**
 * `true` for plain objects — object literals, `Object.create(null)`, and objects
 * whose prototype chain bottoms out at `Object.prototype` or `null`. Arrays,
 * class instances (Date, Map, …), and non-objects are `false`. Faithful port of
 * es-toolkit's `isPlainObject`.
 */
export const isPlainObject = (value: unknown): value is Record<PropertyKey, unknown> => {
  if (!value || typeof value !== "object") {
    return false
  }
  const proto = Object.getPrototypeOf(value) as object | null
  const hasObjectPrototype =
    proto === null || proto === Object.prototype || Object.getPrototypeOf(proto) === null
  if (!hasObjectPrototype) {
    return false
  }
  return Object.prototype.toString.call(value) === "[object Object]"
}
