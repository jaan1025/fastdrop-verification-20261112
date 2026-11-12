// `/token` barrel: the generic ERC-20 surface — read/write pure functions only.
// Hooks live in `./react`; factories + keys live in `./query`.
export {
  getSymbol,
  getDecimals,
  getName,
  getTotalSupply,
  getBalance,
  getAllowance,
  getTokenInfo,
  transfer,
  approve,
  type TokenInfo,
} from "./functions"
