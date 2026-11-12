import { bytesToBase64, bytesToUrlSafeBase64 } from "./from-bytes"

export type Hex = `0x${string}`

export const hexToBytes = (hex: Hex): Uint8Array => {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex
  if (normalized.length % 2 !== 0) {
    throw new Error("Invalid hex string")
  }
  const byteLength = normalized.length / 2
  const bytes = new Uint8Array(byteLength)
  for (let i = 0; i < byteLength; i += 1) {
    const byte = normalized.slice(i * 2, i * 2 + 2)
    bytes[i] = Number.parseInt(byte, 16)
  }
  return bytes
}

export const hexToBase64 = (hex: Hex): string => bytesToBase64(hexToBytes(hex))

export const hexToUrlSafeBase64 = (hex: Hex): string => bytesToUrlSafeBase64(hexToBytes(hex))
