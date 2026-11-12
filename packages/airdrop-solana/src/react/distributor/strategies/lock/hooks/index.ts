// Lock STRATEGY react hooks — thin `use*` over the bridge reads (stream +
// revocation), whose streamId is derived from distributor inputs. The
// query/mutation factories + their data/key types are re-exported for an
// unchanged public surface (mirrors the merkle-distributor hooks sub-barrel).
export { useStream, type UseStreamParameters } from "./use-stream"

export { useStreamRevocation, type UseStreamRevocationParameters } from "./use-stream-revocation"
