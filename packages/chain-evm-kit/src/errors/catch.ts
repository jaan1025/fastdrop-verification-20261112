import { formatRevertError } from "./format"
import { type ErrorAbis } from "./abis"

/**
 * Runs a write fn and, on a contract revert, rethrows a plain `Error` carrying
 * the decoded human-readable message (original preserved in `cause`). The
 * throwing shell over the pure `formatRevertError`; used by the send strategies.
 *
 * `errorAbis` is the injected DI seam — the kit ships no Clique default. When a
 * caught error isn't a decodable revert, the original propagates unchanged.
 */
export const catchRevert = async <T>(fn: () => Promise<T>, errorAbis?: ErrorAbis): Promise<T> => {
  try {
    return await fn()
  } catch (error: unknown) {
    const message = formatRevertError(error, errorAbis)
    if (message) {
      throw new Error(message, { cause: error })
    }
    throw error
  }
}
