// Shared isometric primitives for the login brand-panel illustrations — solid,
// white-backed two-tone indigo volumes + the load/glow animation styles. Each
// app composes these into its own scene (airdrop merkle, vesting schedules,
// portal claim). Decorative only. Render <IsoDefs/> once per <svg>.
export type Pt = { cx: number; cy: number }

export const ISO_ANIM = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes clq-rise { from { opacity: 0 } to { opacity: 1 } }
  @keyframes clq-glow { 0%,100% { opacity: .78 } 50% { opacity: 1 } }
  @keyframes clq-drip { 0% { opacity: 0 } 18% { opacity: .9 } 100% { opacity: 0 } }
  .clq-rise { opacity: 0; animation: clq-rise .6s ease-out .05s forwards }
  .clq-glow { animation: clq-glow 3.2s ease-in-out infinite }
  @keyframes clq-float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-2px) } }
  .clq-float { animation: clq-float 3.2s ease-in-out infinite }
}
`

export function IsoDefs() {
  return (
    <defs>
      <radialGradient id="clq-hero" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#2657ff" stopOpacity={0.3} />
        <stop offset="62%" stopColor="#2657ff" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="clq-contact" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#2657ff" stopOpacity={0.08} />
        <stop offset="100%" stopColor="#2657ff" stopOpacity={0} />
      </radialGradient>
    </defs>
  )
}

// a solid, white-backed two-tone isometric cube (the hero is fully saturated)
export function Cube({ cx, cy, r = 14, hero }: Pt & { r?: number; hero?: boolean }) {
  const ry = r / 2
  const h = r * 1.04
  const top = `${cx},${cy - ry} ${cx + r},${cy} ${cx},${cy + ry} ${cx - r},${cy}`
  const left = `${cx - r},${cy} ${cx},${cy + ry} ${cx},${cy + ry + h} ${cx - r},${cy + h}`
  const right = `${cx + r},${cy} ${cx},${cy + ry} ${cx},${cy + ry + h} ${cx + r},${cy + h}`
  const hull = `${cx},${cy - ry} ${cx + r},${cy} ${cx + r},${cy + h} ${cx},${cy + ry + h} ${cx - r},${cy + h} ${cx - r},${cy}`
  if (hero) {
    return (
      <g stroke="#1e45d6" strokeWidth={1} strokeLinejoin="round">
        <polygon points={left} fill="#1e45d6" />
        <polygon points={right} fill="#4f78ff" />
        <polygon points={top} fill="#2657ff" />
      </g>
    )
  }
  return (
    <g strokeLinejoin="round">
      <polygon points={hull} fill="#fff" />
      <polygon points={left} fill="#2657ff" fillOpacity={0.16} />
      <polygon points={right} fill="#2657ff" fillOpacity={0.05} />
      <polygon points={top} fill="#2657ff" fillOpacity={0.11} />
      <polygon points={hull} fill="none" stroke="#2657ff" strokeOpacity={0.3} strokeWidth={1} />
    </g>
  )
}

// a thin isometric platform tile (optional soft contact shadow)
export function Platform({ cx, cy, w, shadow }: Pt & { w: number; shadow?: boolean }) {
  const hh = w / 2
  const d = 5
  return (
    <g strokeLinejoin="round">
      {shadow && (
        <ellipse
          cx={cx}
          cy={cy + hh + d + 16}
          rx={w * 0.95}
          ry={w * 0.4}
          fill="url(#clq-contact)"
        />
      )}
      <polygon
        points={`${cx},${cy - hh} ${cx + w},${cy} ${cx + w},${cy + d} ${cx},${cy + hh + d} ${cx - w},${cy + d} ${cx - w},${cy}`}
        fill="#fff"
      />
      <polygon
        points={`${cx - w},${cy} ${cx},${cy + hh} ${cx},${cy + hh + d} ${cx - w},${cy + d}`}
        fill="#2657ff"
        fillOpacity={0.16}
      />
      <polygon
        points={`${cx + w},${cy} ${cx},${cy + hh} ${cx},${cy + hh + d} ${cx + w},${cy + d}`}
        fill="#2657ff"
        fillOpacity={0.05}
      />
      <polygon
        points={`${cx},${cy - hh} ${cx + w},${cy} ${cx},${cy + hh} ${cx - w},${cy}`}
        fill="#2657ff"
        fillOpacity={0.1}
        stroke="#2657ff"
        strokeOpacity={0.38}
        strokeWidth={1}
      />
    </g>
  )
}

// a vertical isometric bar (a token column rising to height H from base cy)
export function Bar({ cx, cy, w = 16, h, glow }: Pt & { w?: number; h: number; glow?: boolean }) {
  const ry = w / 2
  const topY = cy - h
  const top = `${cx},${topY - ry} ${cx + w},${topY} ${cx},${topY + ry} ${cx - w},${topY}`
  const left = `${cx - w},${topY} ${cx},${topY + ry} ${cx},${cy + ry} ${cx - w},${cy}`
  const right = `${cx + w},${topY} ${cx},${topY + ry} ${cx},${cy + ry} ${cx + w},${cy}`
  const hull = `${cx},${topY - ry} ${cx + w},${topY} ${cx + w},${cy} ${cx},${cy + ry} ${cx - w},${cy} ${cx - w},${topY}`
  if (glow) {
    return (
      <g stroke="#1e45d6" strokeWidth={1} strokeLinejoin="round">
        <polygon points={left} fill="#1e45d6" />
        <polygon points={right} fill="#4f78ff" />
        <polygon points={top} fill="#2657ff" />
      </g>
    )
  }
  return (
    <g strokeLinejoin="round">
      <polygon points={hull} fill="#fff" />
      <polygon points={left} fill="#2657ff" fillOpacity={0.14} />
      <polygon points={right} fill="#2657ff" fillOpacity={0.05} />
      <polygon points={top} fill="#2657ff" fillOpacity={0.1} />
      <polygon points={hull} fill="none" stroke="#2657ff" strokeOpacity={0.28} strokeWidth={1} />
    </g>
  )
}
