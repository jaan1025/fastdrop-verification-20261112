// TODO: Remove once @safe-global/types-kit stops polluting abitype AddressType
// Without this, wagmi/viem Address type degrades to `string`, causing type errors across EVM code
// Override @safe-global/types-kit's pollution of abitype Register
// which sets AddressType to `string` instead of `0x${string}`
declare module "abitype" {
  interface Register {
    AddressType: `0x${string}`
  }
}
