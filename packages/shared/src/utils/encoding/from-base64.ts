export const base64ToBytes = (base64: string): Uint8Array => {
  const normalized = base64.replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export const base64ToUrlSafe = (base64: string) => {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}
