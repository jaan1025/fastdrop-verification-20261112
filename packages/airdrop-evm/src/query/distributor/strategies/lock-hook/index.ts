// LockHook query layer — read queryOptions + preset mutationOptions factories.
// React-free; the thin `use*` hooks live in
// `react/distributor/strategies/lock-hook/hooks`. (Claim is no
// longer a chain-package flow — it lives in the app-layer claim facades, composing
// the raw `lockHookClaim` contract primitive directly.)
export {
  evmStreamIdQueryOptions,
  type EvmStreamIdData,
  type EvmStreamIdQueryKey,
  type UseStreamIdParameters,
} from "./stream-id"
export {
  evmStreamPresetQueryOptions,
  type EvmStreamPresetData,
  type EvmStreamPresetQueryKey,
  type UseStreamPresetParameters,
} from "./stream-preset"
export {
  evmSetStreamPresetMutationOptions,
  type SetStreamPresetParams,
  type SetStreamPresetData,
  type StreamPreset,
} from "./set-stream-preset"
