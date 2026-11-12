// Sub-barrel for `@repo/shared/client` — the generic HTTP client factory subpath.
// Kept separate from `/utils` so pure-util consumers never pull in `axios`.
export * from "./create-client"
