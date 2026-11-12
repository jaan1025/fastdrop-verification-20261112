// `lock` family barrel: the CliqueLock escrow contract functions, ABI, and the
// shared-lock address registry (EVM `revokeStream` is part of the lock family).
// The CliqueLockHook orchestrator owns its own barrel
// (`../distributor/strategies/lock-hook`); key slices live in `../../query/keys`.
export { default as lockAbi } from "./abi"
export {
  getStream,
  getClaimableAmount,
  getStreamRevocation,
  type EvmStreamRevocation,
  revokeStream,
  type Stream,
} from "./functions"
export { getSharedLockAddress } from "./shared-lock-addresses"
