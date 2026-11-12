import { base64ToUrlSafe } from "./from-base64"
import { bytesToBase64 } from "./from-bytes"

export const stringToBytes = (value: string): Uint8Array => new TextEncoder().encode(value)

export const stringToBase64 = (value: string): string => bytesToBase64(stringToBytes(value))

export const stringToUrlSafeBase64 = (value: string): string =>
  base64ToUrlSafe(stringToBase64(value))
