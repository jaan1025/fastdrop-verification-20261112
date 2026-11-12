// tos-signer sub-barrel (internal). The matched hook set + the host component +
// the EVM payload type. The channel token, store internals, and runtime seam
// stay private.
export {
  evmToSSigner,
  useSignToS,
  useToSSignerHost,
  useEnsureToSSigned,
  useToSSignatureStore,
  type ToSPayload,
  type EvmAddress,
} from "./signer"
export { EvmToSSigner, type EvmToSSignerProps } from "./host"
// formatAddressForTemplate stays in ../../tos-signer/format-address (pure primitive)
// but is re-exported here so the ./tos-signer subpath stays complete.
export { formatAddressForTemplate } from "../../tos-signer/format-address"
