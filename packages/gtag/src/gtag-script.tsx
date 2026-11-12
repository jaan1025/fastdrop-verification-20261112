import { resolveGtagId } from "./gtag-id"
import { buildGtagInitScript, buildGtagLoaderSrc } from "./snippet"

// GA4 bootstrap for TanStack Start. Mono used `next/script`; there is no
// equivalent here, so we render plain SSR'd <script> tags — the app mounts this
// in the document shell (`<head>`), where the initial HTML executes both scripts
// on load. React strips string children of <script>, so the inline init goes
// through `dangerouslySetInnerHTML`; the content is our own snippet (no user
// input), not an XSS surface.
//
// Race safety: the async loader never blocks, and the inline init runs
// synchronously to seed `window.dataLayer` + the `gtag()` stub before gtag.js
// resolves. Order in the HTML (loader first, init second) is irrelevant — the
// stub is defined immediately regardless of when the async loader finishes.

export const GTagScript = () => {
  const gtagId = resolveGtagId()
  if (!gtagId) {
    return null
  }
  return (
    <>
      <script async src={buildGtagLoaderSrc(gtagId)} />
      <script id="gtag" dangerouslySetInnerHTML={{ __html: buildGtagInitScript(gtagId) }} />
    </>
  )
}
