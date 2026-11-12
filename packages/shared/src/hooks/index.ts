// Sub-barrel for `@repo/shared/hooks` — every generic React hook plus the flow
// type surface. This is the file the `exports` map points `@repo/shared/hooks` at.
export { usePersistFn } from "./use-persist-fn"
export { useAsyncPersistFn } from "./use-async-persist-fn"
export { useIsMobileLayout } from "./use-is-mobile-layout"
export { useDeviceDetection, type DeviceInfo } from "./use-device-detection"
export { useResolvePathname } from "./use-resolve-pathname"
export { useNow } from "./use-now"
export { useTimeLeft, type TimeLeft } from "./use-time-left"
export { useTimeReached, type UseTimeReachedOptions } from "./use-time-reached"
export {
  useFlowState,
  type FlowState,
  type FlowError,
  type FlowController,
  type FlowPersistedEntry,
  type FlowPersistence,
} from "./flow"
