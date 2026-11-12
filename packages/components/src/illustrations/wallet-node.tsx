import WalletMetamask from "@web3icons/react/icons/wallets/WalletMetamask"
import WalletOkx from "@web3icons/react/icons/wallets/WalletOkx"
import WalletPhantom from "@web3icons/react/icons/wallets/WalletPhantom"
import WalletCoinbase from "@web3icons/react/icons/wallets/WalletCoinbase"
import { Platform } from "./iso"
import type { Pt } from "./iso"

// A "final node" in the brand-panel illustrations: a real, branded wallet app
// glyph (MetaMask / OKX / Phantom) billboarded on an isometric platform — the
// abstract indigo distribution flow resolving into a recognizable destination
// wallet. The glyph keeps its authentic brand colours against the mono scene.
// Decorative, aria-hidden via the parent <svg>.
export type WalletBrand = "metamask" | "okx" | "phantom" | "coinbase"
export type WalletVariant = "branded" | "mono" | "background"

// Each brand's glyph occupies a different slice of the 24-unit web3icons
// viewBox, so `base` is the glyph's visual bottom — used to seat every mark on
// the platform crest instead of floating above it.
const GLYPH = {
  metamask: { Icon: WalletMetamask, base: 20.5 },
  okx: { Icon: WalletOkx, base: 21 },
  phantom: { Icon: WalletPhantom, base: 19.4 },
  coinbase: { Icon: WalletCoinbase, base: 21 },
} as const

export function IsoWalletIcon({
  cx,
  cy,
  brand,
  size = 20,
  shadow,
  variant = "branded",
  color,
  floatDelay = 0,
}: Pt & {
  brand: WalletBrand
  size?: number
  shadow?: boolean
  variant?: WalletVariant
  color?: string
  floatDelay?: number
}) {
  const { Icon, base } = GLYPH[brand]
  // the `background` variant is a full-bleed tile, so it seats on its whole
  // footprint; the transparent glyphs seat on their own visual base
  const footing = variant === "background" ? 24 : base
  const w = Math.round(size * 0.46)
  const ty = cy + 1 - (footing / 24) * size
  return (
    <g>
      <Platform cx={cx} cy={cy} w={w} shadow={shadow} />
      <g transform={`translate(${cx - size / 2} ${ty})`}>
        <g className="clq-float" style={{ animationDelay: `${floatDelay}s` }}>
          <Icon variant={variant} size={size} color={color} />
        </g>
      </g>
    </g>
  )
}
