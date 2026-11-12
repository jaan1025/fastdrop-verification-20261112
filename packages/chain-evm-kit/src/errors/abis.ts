import { type Abi, erc20Abi, erc721Abi, erc1155Abi } from "viem"
import safeTransferLibAbi from "./abis/safe-transfer-lib-abi"

/**
 * The injected DI seam: a plain list of candidate ABIs tried, in order, during
 * revert decoding. It's just an array — no wrapper, no constructor. Callers that
 * know their contract set (the contracts package) pass their composed list; the
 * kit ships no Clique default.
 */
export type ErrorAbis = readonly Abi[]

/**
 * Generic, chain-ecosystem-level error ABIs: viem's ERC-20/721/1155 + the Solady
 * `SafeTransferLib` custom errors. Exposed so the Clique contracts package can
 * compose its `DEFAULT_ERROR_ABIS` on top of these without re-declaring them.
 * Order is load-bearing (decoding returns the first ABI that matches).
 */
export const GENERIC_ERROR_ABIS: ErrorAbis = [safeTransferLibAbi, erc20Abi, erc721Abi, erc1155Abi]
