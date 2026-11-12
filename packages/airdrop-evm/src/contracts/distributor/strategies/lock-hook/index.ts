// `lock-hook` family barrel: the CliqueLockHook orchestrator ABI + functions
// (stream id / preset reads, set-preset write, and the lock-hook `claim` that
// forwards the vested portion of an existing on-chain stream).
export { default as lockHookAbi } from "./abi"
export {
  getStreamId,
  getStreamPreset,
  setStreamPreset,
  claim as lockHookClaim,
  type StreamPreset,
} from "./functions"
