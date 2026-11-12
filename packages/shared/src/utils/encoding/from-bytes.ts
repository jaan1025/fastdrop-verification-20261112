import { base64ToUrlSafe } from "./from-base64"

export const bytesToHex = (bytes: Uint8Array): `0x${string}` => {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  return `0x${hex}`
}

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = ""
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export const bytesToString = (bytes: Uint8Array): string => new TextDecoder().decode(bytes)

export const bytesToUrlSafeBase64 = (bytes: Uint8Array): string =>
  base64ToUrlSafe(bytesToBase64(bytes))
