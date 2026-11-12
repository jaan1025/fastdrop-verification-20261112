// LockHook react hooks barrel. Hooks are the `.useRead`/`.useWrite` halves of the
// kit skeletons, built over the React-free queryOptions/mutationOptions factories
// in `query/distributor/strategies/lock-hook`.

export { useStreamId } from "./use-stream-id"
export { useStreamPreset } from "./use-stream-preset"
export { useSetStreamPreset } from "./use-set-stream-preset"

export {
  type UseStreamIdParameters,
  type UseStreamPresetParameters,
} from "../../../../../query/distributor/strategies/lock-hook"
