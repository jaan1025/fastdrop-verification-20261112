import { findAnchorEvent } from "@repo/chain-solana-kit/utils"
import {
  getRevokeStreamEventDecoder,
  type RevokeStreamEvent,
} from "../generated/types/revokeStreamEvent"

// sha256("event:RevokeStreamEvent")[0..8] — anchor's event discriminator. The
// generated codecs carry no discriminators, so it is pinned here; the unit test
// recomputes it from the preimage.
export const REVOKE_STREAM_EVENT_DISCRIMINATOR = new Uint8Array([
  44, 242, 210, 130, 93, 37, 148, 168,
])

export const findRevokeStreamEventInLogs = (
  logMessages: readonly string[],
): RevokeStreamEvent | null =>
  findAnchorEvent(logMessages, REVOKE_STREAM_EVENT_DISCRIMINATOR, (bytes) =>
    getRevokeStreamEventDecoder().decode(bytes),
  )
