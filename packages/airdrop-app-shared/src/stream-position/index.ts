// Stream-position view assembly shared by the console + portal position
// surfaces: the chain-free lifecycle resolver, the `StreamMetrics` display
// shape, and the per-chain assemblers that turn already-fetched on-chain (or
// preset-estimated) stream data into it. The `-evm` / `-solana` assembler arms
// carry EVM raw-seconds vs Solana-calendar display semantics and are never
// unified. Protocol math + revocation truth stay in `@repo/airdrop-base`.

export { resolveStreamLifecycle } from "./lifecycle"
export type { StreamLifecycle } from "./lifecycle"

export type { StreamMetrics, StreamRevocationInfo } from "./types"

export { assembleStreamMetricsEvm } from "./assemble-stream-metrics-evm"
export type {
  AssembleStreamMetricsEvmInput,
  EvmStreamRecord,
  EvmPresetWire,
} from "./assemble-stream-metrics-evm"

export { assembleStreamMetricsSolana } from "./assemble-stream-metrics-solana"
export type {
  AssembleStreamMetricsSolanaInput,
  SolanaStreamRecord,
  SolanaClaimableResult,
  SolanaPresetWire,
} from "./assemble-stream-metrics-solana"

export { deriveScheduleTimeline } from "./timeline"
export type { ScheduleSpans, ScheduleTimeline } from "./timeline"
