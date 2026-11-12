/**
 * a persistFn is implemented based on the useRef, so the reference of the function is stable
 * and fnRef will be updated in every render, so we can get the latest react states
 */

import { useMemo, useRef } from "react"

// The callable shape constraint. This is the one place a bare `any` is
// unavoidable: a generic upper bound that must accept *any* function signature
// (incl. tuple-arg listeners) can only be expressed with `any[]`/`any` — a
// tighter `unknown[]` bound rejects tuple-arg callees by contravariance. The
// public surface stays tight: callers see `T`, never `AnyFn`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (this: any, ...args: any[]) => any

type PickFunction<T extends AnyFn> = (
  this: ThisParameterType<T>,
  ...args: Parameters<T>
) => ReturnType<T>

export const usePersistFn = <T extends AnyFn>(fn: T): T => {
  const fnRef = useRef<T>(fn)

  // why not write `fnRef.current = fn`?
  // https://github.com/alibaba/hooks/issues/728
  fnRef.current = useMemo(() => fn, [fn])

  const persistFnRef = useRef<PickFunction<T>>(null)
  if (!persistFnRef.current) {
    persistFnRef.current = function (this, ...args) {
      return fnRef.current.apply(this, args)
    }
  }

  return persistFnRef.current as T
}
