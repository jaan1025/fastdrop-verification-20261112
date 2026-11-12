// commit-reveal sub-barrel (internal). The SquadsX transport + the
// transport-agnostic scheme for the 100-byte wire signature.
export {
  signMessageWithCommitReveal,
  computeCommitment,
  assembleCommitRevealSignature,
  MEMO_SIG_PREFIX,
  type SignMessageWithCommitRevealParams,
} from "./scheme"
export { signMessageWithSquadsX } from "./squads"
