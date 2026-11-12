// Dialog sub-barrel: re-exports the slot contract type + the reusable
// scroll-gate hook. Both are part of the public surface (re-exported by the root
// barrel) — the slot type lets the app wire its own dialog, the hook lets it
// (or `@repo/components`) gate Accept.
export type { ToSDialogProps } from "./slot"
export { useScrolledToBottom } from "./use-scrolled-to-bottom"
