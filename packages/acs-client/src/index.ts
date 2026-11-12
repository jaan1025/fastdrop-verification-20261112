// Root convenience barrel. The deliberate public surface is the five curated
// subpaths (`@repo/acs-client/{model,transport,actions,query,react}`); this `.`
// entry re-exports them for callers that prefer a single import specifier. The
// layers are strictly one-directional `model → transport → actions → query →
// react`, so the names do not collide.
export * from "./model"
export * from "./transport"
export * from "./actions"
export * from "./query"
export * from "./react"
