// The Sentry event id is shown truncated to 8 chars but the FULL id is copied to
// the clipboard (so support can look up the exact event). Keep both arms.
export interface SplitEventId {
  /** First 8 chars — what the ref-id button renders. */
  readonly display: string
  /** The complete event id — what lands on the clipboard. */
  readonly full: string
}

export const splitEventId = (eventId: string): SplitEventId => ({
  display: eventId.slice(0, 8),
  full: eventId,
})
