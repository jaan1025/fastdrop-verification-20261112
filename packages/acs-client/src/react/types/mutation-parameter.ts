import type { DefaultError, UseMutationOptions } from "@tanstack/react-query"

/**
 * Optional `mutation` slot for mutation hooks. Mirrors wagmi v2's
 * `MutationParameter` — lets callers pass standard TanStack Query mutation
 * options (`onMutate`, `onSuccess`, `onError`, `onSettled`, `retry`, …)
 * alongside the hook's defaults.
 *
 * Omits the keys each hook's `*MutationOptions` factory owns:
 * `mutationFn`, `mutationKey`, `throwOnError`.
 */
export type MutationParameter<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = {
  mutation?:
    | Omit<
        UseMutationOptions<TData, TError, TVariables, TContext>,
        "mutationFn" | "mutationKey" | "throwOnError"
      >
    | undefined
}
