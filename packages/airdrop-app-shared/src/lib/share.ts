import { getWindow } from "@repo/shared/utils"

/**
 * Builds an X (Twitter) share-intent URL. Browser-only — reads the page origin
 * via the shared SSR guard. Lifted IN from `@repo/shared/utils/share` (it is
 * product / app-runtime config, not a generic base-tier util).
 */
export const getShareXLink = (params: { text: string; withOrigin?: boolean }): string => {
  const { text, withOrigin = false } = params
  const origin = withOrigin ? getWindow()?.location.origin : undefined
  const finalText = [text, origin].filter(Boolean).join(" ")
  return `https://x.com/intent/post?text=${encodeURIComponent(finalText)}`
}
