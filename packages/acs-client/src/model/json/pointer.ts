/**
 * RFC 6901 — escape `~` and `/` in a JSON Pointer segment. Order matters:
 * `~` must be escaped first (`~` → `~0`) before `/` (`/` → `~1`), otherwise
 * a literal `/` already containing `~` would be double-escaped.
 */
export function escapeJsonPointerSegment(s: string): string {
  return s.replace(/~/g, "~0").replace(/\//g, "~1")
}
