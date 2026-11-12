export interface ToSResponse {
  /** Concrete ToS message text to present/sign. */
  tosMessage: string
  /** Template the message was rendered from (`{address}`, `{TOS_HASH}` placeholders). */
  tosTemplate: string
}
