// Pure builders for the GA4 gtag.js bootstrap. Kept free of React and env so the
// byte-exact snippet can be golden-tested in isolation. The two outputs together
// are the standard GA4 snippet; keep them byte-equivalent to the reference —
// analytics tooling and dedupe rely on the exact text.

/** The async loader URL for gtag.js, keyed by the GA measurement id. */
export const buildGtagLoaderSrc = (gtagId: string): string =>
  `https://www.googletagmanager.com/gtag/js?id=${gtagId}`

/**
 * The inline init script that must run alongside the async loader. It seeds
 * `window.dataLayer` and the `gtag()` stub synchronously (before the async
 * loader resolves), so any queued commands survive until gtag.js takes over —
 * this immediate stub is what makes the async loader race-safe. Byte-identical
 * to the reference snippet, including the leading and trailing newlines.
 */
export const buildGtagInitScript = (gtagId: string): string =>
  `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gtagId}');
`
