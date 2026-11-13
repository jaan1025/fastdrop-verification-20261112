import { inspectChain } from "../packages/fastdrop-inspector/src/index"
try {
  const input = JSON.parse(process.env.FASTDROP_INSPECT_INPUT ?? "null")
  const providers = {
    alchemyApiKey: process.env.VITE_ALCHEMY_API_KEY,
    solanaRpcUrl: process.env.VITE_SOLANA_RPC_URL,
    rpcUrl: process.env.FASTDROP_RPC_URL,
  }
  if (providers.rpcUrl) {
    const url = new URL(providers.rpcUrl)
    if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("FASTDROP_RPC_URL must be HTTPS or a local RPC.")
  }
  process.stdout.write(JSON.stringify(await inspectChain(input, providers)) + "\n")
} catch (error) {
  const message = error instanceof Error && (error.name === "FastdropValidation" || "code" in error || error.message.startsWith("FASTDROP_RPC_URL"))
    ? error.message : "Could not verify the on-chain deployment. Check the distributor, root and RPC."
  process.stderr.write(`Fastdrop: ${message}\n`)
  process.exitCode = 1
}
