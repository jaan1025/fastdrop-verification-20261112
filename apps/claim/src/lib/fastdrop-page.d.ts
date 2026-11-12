declare module "virtual:fastdrop-claim-runtime" {
  const ClaimRuntime: import("react").ComponentType<
    import("~/features/claim/claim-session").ClaimRuntimeProps
  >
  export default ClaimRuntime
}
