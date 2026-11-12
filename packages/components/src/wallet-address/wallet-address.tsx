import { useMemo } from "react"
import { getAddress } from "viem"
import {
  ADDRESS_TRUNCATE_PREFIX,
  ADDRESS_TRUNCATE_SUFFIX,
  truncateAddress,
} from "@repo/shared/utils"
import { CopyableValue } from "../copyable-value"

export function WalletAddress({
  address,
  prefixLength = ADDRESS_TRUNCATE_PREFIX,
  suffixLength = ADDRESS_TRUNCATE_SUFFIX,
  className,
}: {
  address: string
  prefixLength?: number
  suffixLength?: number
  className?: string
}) {
  // EIP-55 mixed-case checksum for valid EVM hex addresses — restores
  // transcription-error detection lost when the transport lowercases.
  // `getAddress` throws on non-EVM input (Solana base58, hashes, malformed
  // strings); fall back to the verbatim string in that case.
  const display = useMemo(() => {
    try {
      return getAddress(address as `0x${string}`)
    } catch {
      return address
    }
  }, [address])
  const truncated = truncateAddress(display, {
    prefix: prefixLength,
    suffix: suffixLength,
  })

  // Copy the original input verbatim — admins pasting an address they just
  // saw expect the stored form, not a re-checksummed variant.
  return (
    <CopyableValue
      value={address}
      tooltip={<span className="font-mono text-xs">{display}</span>}
      copyLabel="Copy address"
      className={className}
    >
      <span className="font-mono">{truncated}</span>
    </CopyableValue>
  )
}
