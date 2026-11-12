import { camelCase, snakeCase } from "./string"
import { isPlainObject } from "./predicate"

export const camelCaseDeep = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    return obj.map((v) => camelCaseDeep(v)) as unknown as T
  }
  if (isPlainObject(obj)) {
    return Object.keys(obj as Record<string, unknown>).reduce(
      (acc, key) => {
        const camelKey = camelCase(key)
        acc[camelKey] = camelCaseDeep((obj as Record<string, unknown>)[key])
        return acc
      },
      {} as Record<string, unknown>,
    ) as unknown as T
  }
  return obj
}

export const snakeCaseDeep = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    return obj.map((v) => snakeCaseDeep(v)) as unknown as T
  }
  if (isPlainObject(obj)) {
    return Object.keys(obj as Record<string, unknown>).reduce(
      (acc, key) => {
        const snakeKey = snakeCase(key)
        acc[snakeKey] = snakeCaseDeep((obj as Record<string, unknown>)[key])
        return acc
      },
      {} as Record<string, unknown>,
    ) as unknown as T
  }
  return obj
}
