// Barrel for the illustrations subpath (`@repo/components/illustrations`) — the
// shared brand-art PRIMITIVES (iso volumes + wallet nodes + animation CSS + the
// CliqueMark brand mark). `CliqueMark` is the live consumer (top-bar logo in
// `LoginShell`). The iso/wallet-node primitives are currently unused — they
// composed the per-app login scenes that the dashboard-preview brand panel
// replaced; kept as catalog primitives. `blueprint-canvas` is NOT here (DELETED
// everywhere — un-clique).
export { Cube, Platform, Bar, IsoDefs, ISO_ANIM, type Pt } from "./iso"
export { IsoWalletIcon, type WalletBrand, type WalletVariant } from "./wallet-node"
export { CliqueMark, type CliqueMarkProps } from "./clique-mark"
