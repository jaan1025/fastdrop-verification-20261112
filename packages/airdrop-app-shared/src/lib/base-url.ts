import { atom, useAtomValue, useSetAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { runtimeEnv } from "../env"

// localStorage-backed override for the ACS base URL. `null` means "use the
// build-time env default" (`VITE_API_BASE_URL`). Persisted so a debug URL
// survives reloads.
const baseUrlOverrideAtom = atomWithStorage<string | null>(
  "clique:settings:api-base-url-override",
  null,
  undefined,
  { getOnInit: true },
)

const effectiveBaseUrlAtom = atom((get) => get(baseUrlOverrideAtom) ?? runtimeEnv.apiBaseUrl)

export function useApiBaseUrl(): string {
  return useAtomValue(effectiveBaseUrlAtom)
}

export function useApiBaseUrlOverride(): string | null {
  return useAtomValue(baseUrlOverrideAtom)
}

export function useSetApiBaseUrlOverride() {
  return useSetAtom(baseUrlOverrideAtom)
}

export const API_BASE_URL_FALLBACK = runtimeEnv.apiBaseUrl
