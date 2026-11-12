import { renameSync, rmSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"

const staging = new URL("../.fastdrop-build/", import.meta.url)
const client = new URL("client/", staging)
const output = new URL("../dist/", import.meta.url)
const backup = new URL("../.fastdrop-export-backup/", import.meta.url)

const shell = new URL("index.html", client)
if (!statSync(shell, { throwIfNoEntry: false })?.isFile()) {
  throw new Error("The SPA build did not emit client/index.html.")
}

rmSync(backup, { recursive: true, force: true })
const hadOutput: boolean = statSync(output, { throwIfNoEntry: false }) !== undefined
if (hadOutput) renameSync(output, backup)

try {
  renameSync(client, output)
} catch (error) {
  if (hadOutput) {
    try {
      renameSync(backup, output)
    } catch (restoreError) {
      throw new AggregateError(
        [error, restoreError],
        "Static export failed and the previous artifact could not be restored.",
      )
    }
  }
  throw error
}

for (const stalePath of [backup, staging]) {
  try {
    rmSync(stalePath, { recursive: true, force: true })
  } catch {
    console.warn(`Static artifact: could not remove ${fileURLToPath(stalePath)}`)
  }
}
console.log(`Static artifact: ${fileURLToPath(output)}`)
