// signing sub-barrel (internal). The message-signing strategy fan-out (SquadsX
// commit-reveal / memo-tx hardware / wallet-standard). Pure primitives only;
// `useSignMessage` has moved to src/react/signing/ (surfaced via /react).
export { isUserRejection } from "./is-user-rejection"
export { signMessageWithMemoTx } from "./memo-tx"
export {
  signMessageWithCommitReveal,
  signMessageWithSquadsX,
  computeCommitment,
  assembleCommitRevealSignature,
  MEMO_SIG_PREFIX,
} from "./commit-reveal"
// Message-signing capability probe — a wallet-standard feature check. Relocated
// here from the `/utils` door (its origin has always been `signing/`).
export { walletSupportsSignMessage } from "./wallet-features"
