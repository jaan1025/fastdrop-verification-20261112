// Resolves the GA measurement id from client env. Mono read this from
// `NEXT_PUBLIC_GTAG`; under Vite/TanStack Start the client convention is
// `VITE_GTAG` (client vars must carry the `VITE_` prefix to be inlined at build).
// Vite injects `import.meta.env`; node/vitest tooling exposes `process.env`, so we
// read both — the shared idiom, owned by @repo/shared/utils.

import { readTrimmedClientEnv } from "@repo/shared/utils"

/**
 * The GA measurement id, or `undefined` when unset/blank. A blank or
 * whitespace-only value resolves to `undefined` so non-analytics deployments
 * render nothing (mono treated any falsy value as "off").
 */
export const resolveGtagId = (): string | undefined => readTrimmedClientEnv("VITE_GTAG")
