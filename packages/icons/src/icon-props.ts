/**
 * Shared props for every icon: standard SVG props. The caller's `className`
 * merges onto the rendered <svg> (via the Radix Slot wrapper) and any other SVG
 * prop passes through. Hoisted here rather than re-declared per file (the mono
 * repeated this identical empty-extends interface in all icon files).
 */
export type IconProps = React.SVGProps<SVGSVGElement>
