import { resolveChainKind } from "../packages/acs-client/src/model/chain"

const main = async () => {
  const input = JSON.parse(process.env.FASTDROP_INSPECT_INPUT ?? "null")
  const chainKind = resolveChainKind(input?.chainId)
  if (!chainKind) throw new Error("Unsupported ACS chainId.")
  if (chainKind === "evm" && !process.env.VITE_ALCHEMY_API_KEY) {
    throw Object.assign(new Error("Set VITE_ALCHEMY_API_KEY in apps/claim/.env.local to verify and connect to EVM."), { name: "FastdropValidation" })
  }
  const rpcUrl = process.env.FASTDROP_RPC_URL
  if (rpcUrl) {
    const parsed = new URL(rpcUrl)
    if (parsed.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(parsed.hostname)) {
      throw new Error("FASTDROP_RPC_URL must be HTTPS or a local RPC.")
    }
  }
  const read = chainKind === "evm"
    ? (await import("../packages/airdrop-evm/src/fastdrop/inspect-evm")).inspectEvm
    : (await import("../packages/airdrop-solana/src/fastdrop/inspect-solana")).inspectSolana
  process.stdout.write(JSON.stringify(await read({ ...input, rpcUrl })) + "\n")
}

await main().catch((error: unknown) => {
  const message = error instanceof Error && (error.name === "FastdropValidation" || error.message.startsWith("Unsupported ACS") || error.message.startsWith("FASTDROP_RPC_URL"))
    ? error.message
    : "Could not verify the on-chain deployment. Check the distributor, root and RPC."
  process.stderr.write(`Fastdrop: ${message}\n`)
  process.exitCode = 1
})
