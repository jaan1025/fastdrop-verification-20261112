import { NetworkIcon } from "@web3icons/react/dynamic"
import { isSolanaChainId } from "@repo/acs-client/model"

// @web3icons/react v4 NetworkIcon accepts exactly one identifier prop:
// { name } | { chainId: number | string } | { caip2id } | { id }.
// Its metadata indexes EVM networks by numeric chainId directly, so we pass
// `chainId={Number(projectChainId)}` — no slug mapping needed.
// Solana has no chainId in web3icons' metadata (only `id: "solana"` and a
// caip2id with the genesis hash), so it's special-cased to `id="solana"`.
// The project's chainId for Solana clusters is `sol:mainnet` / `sol:devnet`,
// which is detected via @repo/acs-client/model's isSolanaChainId.
export function ChainIcon({
  chainId,
  size = 24,
  variant = "branded",
  className,
}: {
  chainId: string | undefined
  size?: number
  variant?: "mono" | "branded" | "background"
  className?: string
}) {
  const fallback = (
    <span
      aria-hidden
      className={`bg-primary/10 text-primary inline-flex items-center justify-center text-[10px] font-medium ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {chainId?.slice(0, 3).toUpperCase() ?? "—"}
    </span>
  )

  if (!chainId) return fallback

  if (isSolanaChainId(chainId)) {
    return (
      <NetworkIcon
        id="solana"
        variant={variant}
        size={size}
        className={className}
        fallback={fallback}
      />
    )
  }

  const numeric = Number(chainId)
  if (!Number.isFinite(numeric)) return fallback

  return (
    <NetworkIcon
      chainId={numeric}
      variant={variant}
      size={size}
      className={className}
      fallback={fallback}
    />
  )
}
