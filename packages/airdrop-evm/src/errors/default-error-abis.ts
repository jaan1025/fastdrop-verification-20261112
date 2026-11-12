import { GENERIC_ERROR_ABIS, type ErrorAbis } from "@repo/chain-evm-kit/errors"
import distributorAbi from "../contracts/distributor/abi"
import transferAbi from "../contracts/distributor/strategies/transfer-hook/abi"
import transferWithCapHookAbi from "../contracts/distributor/strategies/transfer-with-cap-hook/abi"
import transferOrCoinFlipHookAbi from "../contracts/distributor/strategies/transfer-or-coin-flip-hook/abi"
import lockHookAbi from "../contracts/distributor/strategies/lock-hook/abi"
import linearPenaltyHookAbi from "../contracts/distributor/strategies/linear-penalty-hook/abi"
import lockAbi from "../contracts/lock/abi"

/**
 * The Clique revert-decode ABI list: the distributor / lock / lock-hook /
 * penalty / cap / coin-flip / transfer ABIs composed on top of the kit's generic
 * `GENERIC_ERROR_ABIS` (Solady SafeTransferLib + viem ERC-20/721/1155).
 *
 * This is the dependency-injection seam: the kit's revert-decode engine carries
 * NO Clique default; the contracts package owns the Clique ABI set and injects
 * this list at every Clique write/claim/receipt call site (the kit's
 * `sendAndConfirm` / `confirmTransaction` / `catchRevert`
 * all accept an `errorAbis`). It's a plain array — no wrapper.
 *
 * Order is load-bearing for the golden revert-decode behavior: the Clique ABIs
 * are tried first (so e.g. `InvalidFeeConfig` / `StreamConsumed` decode against
 * the right contract), then the generic ERC/Safe errors. Keep it byte-stable.
 */
export const DEFAULT_ERROR_ABIS: ErrorAbis = [
  distributorAbi,
  transferAbi,
  transferWithCapHookAbi,
  transferOrCoinFlipHookAbi,
  lockHookAbi,
  linearPenaltyHookAbi,
  lockAbi,
  ...GENERIC_ERROR_ABIS,
]
