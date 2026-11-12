// The single SSR-guard home for the whole package (L3). Every `typeof window` /
// `document` check routes through here.

export const isBrowser = (): boolean => typeof window !== "undefined"

export const getWindow = (): Window | undefined =>
  typeof window !== "undefined" ? window : undefined

export const getDocument = (): Document | undefined =>
  typeof document !== "undefined" ? document : undefined

export const isDocumentVisible = (): boolean =>
  typeof document === "undefined" || document.visibilityState === "visible"
