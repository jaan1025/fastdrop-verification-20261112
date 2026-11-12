#!/usr/bin/env node
// Enforces .claude/CLAUDE.md § Multi-Chain Boundary Rule.
//
// This repo runs THREE chains: EVM, Solana, and Sui. A file is either
// chain-free or single-chain; only a thin dispatcher/facade or the app
// composition root may name more than one chain (and only via a rule-2 entry).
//
// Wallet / SDK module sets (deliberately wider than CLAUDE.md's literal wording
// — @wagmi/*, @solana-program/*, @wallet-standard/* are the same wallet stacks'
// natural rot vectors):
//   EVM wallet set:    wagmi, wagmi/*, @wagmi/*, @reown/*
//   Solana wallet set: @solana/*, @solana-program/*, @wallet-standard/*
//   Sui wallet set:    @mysten/*
//
// Rule 1: a wallet-stack module may be imported only by:
//   - the matching chain packages (chain-evm-kit + airdrop-evm for the EVM set;
//     chain-solana-kit + airdrop-solana for the Solana set; chain-sui-kit +
//     airdrop-sui for the Sui set)
//   - files whose basename ends in -evm / -solana / -sui before the extension
//     chain (-evm.ts, -solana.test.ts, -sui.design.tsx, ...) — matching set only
//   - files whose basename starts with evm- / use-evm- / solana- / use-solana- /
//     sui- / use-sui- (matching set only)
//   - rule-1 entries in chain-boundary-exceptions.json (exact or prefix paths)
// Rule 2: importing TWO of the three chain-package sets in one file requires a
//   rule-2 exceptions entry (thin dispatcher / pure-fn boundary / composition
//   root).
// Rule 3: chain packages never import another chain's SDK or chain packages — an
//   EVM chain package must not import the Solana or Sui set, and so on. (Their
//   OWN wallet set and internals are their own business.)
// Rule 4: no file OUTSIDE a chain-dispatch family folder may deep-import into it
//   (reach past the folder barrel into its internals). A family folder is any
//   directory that DIRECTLY contains (a) an index.ts/index.tsx AND (b) at least
//   one chain-arm file whose basename ends in -evm/-solana/-sui (-evm.ts,
//   -solana.design.tsx, ...). Such a folder's family-private arms/support files
//   are reached only through its barrel. A violation is a deep-import (in a file
//   NOT inside that folder) past the barrel: relative specifiers are resolved
//   against the real family dirs (a same-package import into a non-family folder
//   that merely shares a basename with a real family elsewhere is NOT a
//   violation); non-relative (alias/package) specifiers are matched by the family
//   basename followed by `/` and at least one more segment. External code must
//   import the folder (which resolves to its index barrel), never a path into it.
//   Files INSIDE the family folder are exempt (their own ./ and ../<self>/
//   imports are allowed).
//
// Import forms detected (string-level regex over source; comments are NOT
// stripped, both quote styles matched):
//   import ... from "M" / export ... from "M"   (static / re-export)
//   import "M"                                  (side-effect)
//   import("M")                                 (dynamic)
// A module path mentioned in prose or backticks without one of these forms
// will not match.
//
// Exceptions: scripts/chain-boundary-exceptions.json, entries { path, rule, reason }.
// An entry suppresses ONLY its declared rule — a rule-2 (dual chains-pkg) entry
// never masks a rule-1 wallet-stack import in the same file. Entries whose path
// has no .ts/.tsx extension are PREFIX entries. Stale entries (matching no
// violation-relevant file) FAIL the run.
//
// Zero-dependency Node script. Run:
// node --experimental-strip-types scripts/check-chain-boundaries.ts

import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, basename, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

type BoundaryRule = 1 | 2 | 3 | 4
type RawException = { path: string; rule: number; reason: string }
type ExceptionEntry = { path: string; rule: BoundaryRule; reason: string; isPrefix: boolean }
type FamilyFolder = { relPosix: string; base: string }
type AirdropFamily = "scale" | "stream" | "distributor" | "schedule" | "root"
type AirdropScopedFamily = Exclude<AirdropFamily, "root">
type EvmFamily = "lock" | "distributor" | "infra"

const SCRIPT_DIR: string = dirname(fileURLToPath(import.meta.url))
const ROOT: string = dirname(SCRIPT_DIR)
const EXCEPTIONS_PATH: string = join(SCRIPT_DIR, "chain-boundary-exceptions.json")

const SCAN_ROOTS: readonly string[] = ["apps", "packages"]

// Directory names to skip entirely while walking.
const SKIP_DIRS: ReadonlySet<string> = new Set([
  "node_modules",
  "dist",
  ".turbo",
  ".output",
  ".tanstack",
])

// Chain-owning packages: their internals may import their OWN chain's wallet
// stack (Rule 3 per-set allowance). Each side has a generic kit + an
// airdrop-specific contracts package.
const CHAIN_EVM_PREFIXES: readonly string[] = [
  join("packages", "chain-evm-kit") + sep,
  join("packages", "airdrop-evm") + sep,
]
const CHAIN_SOLANA_PREFIXES: readonly string[] = [
  join("packages", "chain-solana-kit") + sep,
  join("packages", "airdrop-solana") + sep,
]
const CHAIN_SUI_PREFIXES: readonly string[] = [
  join("packages", "chain-sui-kit") + sep,
  join("packages", "airdrop-sui") + sep,
]

const toPosix = (p: string): string => p.split(sep).join("/")

// ---- import detection (string-level regex over source) ---------------------
// Matches the three forms listed in the header: `from "M"` (import/export),
// side-effect `import "M"`, and dynamic `import("M")`.
const moduleRe = (alternatives: string): RegExp =>
  new RegExp(`(?:\\bfrom\\s*|\\bimport\\s*\\(\\s*|\\bimport\\s+)["'](?:${alternatives})["']`)

const EVM_WALLET: RegExp = moduleRe(`wagmi(?:/[^"']*)?|@wagmi/[^"']*|@reown/[^"']*`)
const SOLANA_WALLET: RegExp = moduleRe(
  `@solana/[^"']*|@solana-program/[^"']*|@wallet-standard/[^"']*`,
)
const SUI_WALLET: RegExp = moduleRe(`@mysten/[^"']*`)
const IMPORT_EVM_PKG: RegExp = moduleRe(
  `@repo/chain-evm-kit(?:/[^"']*)?|@repo/airdrop-evm(?:/[^"']*)?`,
)
const IMPORT_SOLANA_PKG: RegExp = moduleRe(
  `@repo/chain-solana-kit(?:/[^"']*)?|@repo/airdrop-solana(?:/[^"']*)?`,
)
const IMPORT_SUI_PKG: RegExp = moduleRe(
  `@repo/chain-sui-kit(?:/[^"']*)?|@repo/airdrop-sui(?:/[^"']*)?`,
)

// Extracts every imported module specifier (all three import forms) for the
// precise Rule-4 relative-path resolution below.
const SPECIFIER_RE: RegExp = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)["']([^"']+)["']/g

// ---- filename classification ------------------------------------------------
// Suffix tolerates multi-dot endings (-evm.test.ts, -solana.design.tsx).
const isEvmLeafName = (b: string): boolean =>
  /-evm(\.[\w-]+)*\.tsx?$/.test(b) || /^(?:use-)?evm-/.test(b)
const isSolanaLeafName = (b: string): boolean =>
  /-solana(\.[\w-]+)*\.tsx?$/.test(b) || /^(?:use-)?solana-/.test(b)
const isSuiLeafName = (b: string): boolean =>
  /-sui(\.[\w-]+)*\.tsx?$/.test(b) || /^(?:use-)?sui-/.test(b)
// Chain-arm filename (final segment -evm / -solana / -sui before the extension
// chain). Used for family-folder detection (Rule 4).
const isChainArmName = (b: string): boolean => /-(?:evm|solana|sui)(\.[\w-]+)*\.tsx?$/.test(b)
const isIndexName = (b: string): boolean => b === "index.ts" || b === "index.tsx"

// ---- exceptions ---------------------------------------------------------------
const isBoundaryRule = (rule: number): rule is BoundaryRule =>
  rule === 1 || rule === 2 || rule === 3 || rule === 4
const rawExceptions: RawException[] = JSON.parse(readFileSync(EXCEPTIONS_PATH, "utf8"))
for (const e of rawExceptions) {
  if (!isBoundaryRule(e.rule)) {
    console.error(
      `chain boundary check FAILED — exceptions entry "${e.path}" has invalid "rule" (must be 1, 2, 3, or 4)`,
    )
    process.exit(1)
  }
}
// An entry is a PREFIX entry if its path has no .ts/.tsx extension.
const exceptions: ExceptionEntry[] = rawExceptions.map((e) => ({
  path: e.path,
  rule: e.rule as BoundaryRule,
  reason: e.reason,
  isPrefix: !/\.tsx?$/.test(e.path),
}))
const usedExceptions = new Set<string>()

const matchException = (relPosix: string, rule: BoundaryRule): boolean => {
  for (const ex of exceptions) {
    if (ex.rule !== rule) continue
    if (ex.isPrefix) {
      if (relPosix === ex.path || relPosix.startsWith(ex.path + "/")) {
        usedExceptions.add(ex.path)
        return true
      }
    } else if (relPosix === ex.path) {
      usedExceptions.add(ex.path)
      return true
    }
  }
  return false
}

// ---- walk ---------------------------------------------------------------------
// While walking we also detect chain-dispatch FAMILY FOLDERS (Rule 4): a
// directory that DIRECTLY contains an index.ts/index.tsx AND at least one
// chain-arm file (-evm / -solana / -sui final segment). For each we record its
// repo-relative posix path; its basename is what external deep-imports name.
const files: string[] = []
const familyFolders: FamilyFolder[] = []
const walk = (absDir: string): void => {
  const entries = readdirSync(absDir)
  let hasIndexHere = false
  let hasArmHere = false
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue
    const abs = join(absDir, entry)
    const st = statSync(abs)
    if (st.isDirectory()) {
      walk(abs)
    } else if (/\.tsx?$/.test(entry) && !/\.gen\.ts$/.test(entry)) {
      files.push(abs)
      if (isIndexName(entry)) hasIndexHere = true
      if (isChainArmName(entry)) hasArmHere = true
    } else {
      if (isIndexName(entry)) hasIndexHere = true
      if (isChainArmName(entry)) hasArmHere = true
    }
  }
  if (hasIndexHere && hasArmHere) {
    const relPosix = toPosix(relative(ROOT, absDir))
    familyFolders.push({ relPosix, base: basename(absDir) })
  }
}
for (const r of SCAN_ROOTS) {
  const abs = join(ROOT, r)
  try {
    if (statSync(abs).isDirectory()) walk(abs)
  } catch {
    /* root absent — ignore */
  }
}

// ---- workspace package roots (for precise non-relative Rule-4 resolution) ---
// Map every workspace package name (@repo/<x>) to its repo-relative dir. A
// non-relative import specifier `@repo/<pkg>/<subpath>` is resolved to
// `<pkgDir>/src/<subpath>` (the `src/` shim covers the exports convention used
// across this repo: every published door maps to `./src/...`). This lets us
// classify package deep-imports against the REAL family dirs instead of a
// collision-prone bare-basename regex — a folder as generically named as
// `components` (chain-sui-kit/src/react/components) no longer matches every
// `@repo/ui/components/*` / `@repo/components/widgets/*` import.
const packageDirByName = new Map<string, string>()
for (const r of ["packages", "apps"]) {
  const abs = join(ROOT, r)
  try {
    for (const entry of readdirSync(abs)) {
      const pkgJson = join(abs, entry, "package.json")
      try {
        const name = JSON.parse(readFileSync(pkgJson, "utf8")).name
        if (name) packageDirByName.set(name, toPosix(join(r, entry)))
      } catch {
        /* no package.json — skip */
      }
    }
  } catch {
    /* root absent — ignore */
  }
}

// Resolve a bare (non-relative) specifier to a repo-relative posix source path,
// or null if it isn't a known workspace package. `@repo/foo` → its src barrel;
// `@repo/foo/bar/baz` → `packages/foo/src/bar/baz`.
const resolvePackageSpecifier = (spec: string): string | null => {
  for (const [name, dir] of packageDirByName) {
    if (spec === name) return `${dir}/src`
    if (spec.startsWith(name + "/")) {
      const sub = spec.slice(name.length + 1)
      return `${dir}/src/${sub}`
    }
  }
  return null
}

// ---- analyze --------------------------------------------------------------------
const violations: string[] = []
let scanned: number = 0

for (const abs of files) {
  const src = readFileSync(abs, "utf8")
  const rel = relative(ROOT, abs)
  const relPosix = toPosix(rel)
  const base: string = basename(abs)
  scanned++

  // Rule 4 — no file outside a family folder may deep-import into it. Every
  // import specifier (relative OR non-relative `@repo/*`) is resolved to a real
  // repo-relative source path and checked against the actual family dirs. A file
  // INSIDE a family folder may reach its own siblings (./x, ../<self>/x) and is
  // exempt. Bare specifiers that aren't known workspace packages, and imports
  // that land exactly on a family barrel, are allowed. This precise resolution
  // (no bare-basename heuristic) means a generically-named family folder such as
  // chain-sui-kit/src/react/components does not collide with @repo/ui/components/*
  // or ~/components/* imports.
  const flaggedFamilies = new Set<string>()
  for (const spec of [...src.matchAll(SPECIFIER_RE)].map((m) => m[1])) {
    if (!spec.includes("/")) continue
    let targetRel: string
    if (spec.startsWith(".")) {
      targetRel = toPosix(relative(ROOT, resolve(dirname(abs), spec)))
    } else {
      const resolved = resolvePackageSpecifier(spec)
      if (!resolved) continue // external / unknown-package specifier
      targetRel = resolved
    }
    for (const f of familyFolders) {
      if (targetRel === f.relPosix) continue // ends at the barrel — allowed
      if (!targetRel.startsWith(f.relPosix + "/")) continue // not into it
      if (relPosix.startsWith(f.relPosix + "/")) continue // inside the family
      flaggedFamilies.add(f.base)
    }
  }
  for (const famBase of flaggedFamilies) {
    if (!matchException(relPosix, 4)) {
      violations.push(
        `${relPosix}: Rule 4 — deep-imports into chain-dispatch family folder "${famBase}/"; import the folder (barrel) only, not its internals`,
      )
    }
  }

  const hasEvmWallet: boolean = EVM_WALLET.test(src)
  const hasSolanaWallet: boolean = SOLANA_WALLET.test(src)
  const hasSuiWallet: boolean = SUI_WALLET.test(src)
  const hasEvmPkg: boolean = IMPORT_EVM_PKG.test(src)
  const hasSolanaPkg: boolean = IMPORT_SOLANA_PKG.test(src)
  const hasSuiPkg: boolean = IMPORT_SUI_PKG.test(src)

  // Rule 3 — chain-package internals: own set allowed, other chains forbidden.
  const inChainsEvm: boolean = CHAIN_EVM_PREFIXES.some((p) => rel.startsWith(p))
  const inChainsSolana: boolean = CHAIN_SOLANA_PREFIXES.some((p) => rel.startsWith(p))
  const inChainsSui: boolean = CHAIN_SUI_PREFIXES.some((p) => rel.startsWith(p))
  if (inChainsEvm || inChainsSolana || inChainsSui) {
    // For the file's own chain, list the two foreign chains' wallet sets +
    // chain packages. A hit on either foreign chain is a Rule-3 violation.
    let foreign: boolean
    let forbidden: string
    if (inChainsEvm) {
      foreign = hasSolanaWallet || hasSuiWallet || hasSolanaPkg || hasSuiPkg
      forbidden =
        "the Solana or Sui set (@solana/*, @solana-program/*, @wallet-standard/*, @mysten/*, @repo/chain-solana-kit, @repo/airdrop-solana, @repo/chain-sui-kit, @repo/airdrop-sui)"
    } else if (inChainsSolana) {
      foreign = hasEvmWallet || hasSuiWallet || hasEvmPkg || hasSuiPkg
      forbidden =
        "the EVM or Sui set (wagmi, @wagmi/*, @reown/*, @mysten/*, @repo/chain-evm-kit, @repo/airdrop-evm, @repo/chain-sui-kit, @repo/airdrop-sui)"
    } else {
      foreign = hasEvmWallet || hasSolanaWallet || hasEvmPkg || hasSolanaPkg
      forbidden =
        "the EVM or Solana set (wagmi, @wagmi/*, @reown/*, @solana/*, @solana-program/*, @wallet-standard/*, @repo/chain-evm-kit, @repo/airdrop-evm, @repo/chain-solana-kit, @repo/airdrop-solana)"
    }
    const own: string = inChainsEvm
      ? "an EVM chain package"
      : inChainsSolana
        ? "a Solana chain package"
        : "a Sui chain package"
    if (foreign && !matchException(relPosix, 3)) {
      violations.push(`${relPosix}: Rule 3 — ${own} must never import ${forbidden}`)
    }
    continue // Rules 1/2 don't apply inside the chain packages (per-set allowance).
  }

  // Rule 1 — wallet-stack imports.
  if (hasEvmWallet && !isEvmLeafName(base) && !matchException(relPosix, 1)) {
    violations.push(
      `${relPosix}: Rule 1 — imports wagmi/@wagmi/@reown but is not an -evm leaf, evm- file, or rule-1 exception`,
    )
  }
  if (hasSolanaWallet && !isSolanaLeafName(base) && !matchException(relPosix, 1)) {
    violations.push(
      `${relPosix}: Rule 1 — imports @solana/@solana-program/@wallet-standard but is not a -solana leaf, solana- file, or rule-1 exception`,
    )
  }
  if (hasSuiWallet && !isSuiLeafName(base) && !matchException(relPosix, 1)) {
    violations.push(
      `${relPosix}: Rule 1 — imports @mysten but is not a -sui leaf, sui- file, or rule-1 exception`,
    )
  }

  // Rule 2 — two chain-package sets in one file.
  const chainPkgCount = (hasEvmPkg ? 1 : 0) + (hasSolanaPkg ? 1 : 0) + (hasSuiPkg ? 1 : 0)
  if (chainPkgCount >= 2 && !matchException(relPosix, 2)) {
    violations.push(
      `${relPosix}: Rule 2 — imports two or more chain-package sets (EVM/Solana/Sui) without a rule-2 exceptions entry (thin dispatcher / pure-fn boundary / composition root only)`,
    )
  }
}

// ---- stale exceptions -------------------------------------------------------------
const stale: ExceptionEntry[] = exceptions.filter((e) => !usedExceptions.has(e.path))
for (const e of stale) {
  violations.push(
    `scripts/chain-boundary-exceptions.json: stale entry — "${e.path}" (rule ${e.rule}) matched no file; update scripts/chain-boundary-exceptions.json`,
  )
}

// ---- airdrop-base family law -----------------------------------------------
// Enforces the dependency lattice INSIDE packages/airdrop-base/src:
//   scale → ∅ · stream → scale · distributor → stream + scale ·
//   schedule → distributor + stream + scale. NO exceptions.
// Family = the file's src-relative location; relative (and self-
// `@repo/airdrop-base/*` door) import specifiers are classified the same way.
//   src-root     → integration/parity tests (e.g. vesting-math-parity) are
//                  cross-family by construction; unscoped.
// Named-import form is assumed (the whole package uses `{ ... }` / `import type
// { ... }` imports).
const AIRDROP_BASE_SRC: string = join(ROOT, "packages", "airdrop-base", "src")
const familyOf = (p: string): AirdropFamily => {
  const s = p.replace(/\.tsx?$/, "")
  if (s === "scale") return "scale"
  if (s === "stream" || s.startsWith("stream/")) return "stream"
  if (s === "distributor" || s.startsWith("distributor/")) return "distributor"
  if (s === "schedule" || s.startsWith("schedule/")) return "schedule"
  return "root"
}
// What each family may reach (besides itself).
const FAMILY_ALLOWED: Record<AirdropScopedFamily, ReadonlySet<AirdropFamily>> = {
  scale: new Set(),
  stream: new Set(["scale"]),
  distributor: new Set(["stream", "scale"]),
  schedule: new Set(["distributor", "stream", "scale"]),
}
const FAMILY_IMPORT_RE: RegExp = /\b(?:import|export)\s+(type\s+)?\{[^{}]*\}\s*from\s*["']([^"']+)["']/g
for (const abs of files) {
  if (!abs.startsWith(AIRDROP_BASE_SRC + sep)) continue
  const srcRel = toPosix(relative(AIRDROP_BASE_SRC, abs))
  const srcFamily: AirdropFamily = familyOf(srcRel)
  if (srcFamily === "root") continue
  const allowed: ReadonlySet<AirdropFamily> = FAMILY_ALLOWED[srcFamily]
  const src = readFileSync(abs, "utf8")
  for (const m of src.matchAll(FAMILY_IMPORT_RE)) {
    const spec = m[2]
    let targetRel: string
    if (spec.startsWith(".")) {
      targetRel = toPosix(relative(AIRDROP_BASE_SRC, resolve(dirname(abs), spec)))
    } else if (spec.startsWith("@repo/airdrop-base/")) {
      targetRel = spec.slice("@repo/airdrop-base/".length)
    } else {
      continue // cross-package import — not an airdrop-base family edge
    }
    const targetFamily: AirdropFamily = familyOf(targetRel)
    if (targetFamily === srcFamily || targetFamily === "root") continue
    if (!allowed.has(targetFamily)) {
      violations.push(
        `packages/airdrop-base/src/${srcRel}: airdrop-base family law — ${srcFamily} may not import ${targetFamily} (lattice: scale→∅, stream→scale, distributor→stream+scale, schedule→distributor+stream+scale) (offending: "${spec}")`,
      )
    }
  }
}

// ---- airdrop-evm family law ------------------------------------------------
// Enforces the standalone-lock rule INSIDE packages/airdrop-evm/src: the lock
// family (a CliqueLock stream escrow) must NEVER import the distributor family
// (the merkle claim gate + its strategy attachments under distributor/strategies).
// Family = the second path segment under a tri-layer folder:
//   {contracts,query,react}/lock/**         → "lock"
//   {contracts,query,react}/distributor/**  → "distributor" (incl. strategies/)
//   everything else (transaction/, misc/, query/keys.ts, layer barrels, types/) →
//                                             "infra" — cross-family transport, unscoped.
// airdrop-evm's doors are LAYERS (./contracts ./query ./react) that span both
// families, so a `@repo/airdrop-evm/*` specifier resolves to a cross-family
// barrel, not a family path; only RELATIVE specifiers are classified.
// distributor→lock stays unrestricted (the distributor composes lock).
const AIRDROP_EVM_SRC: string = join(ROOT, "packages", "airdrop-evm", "src")
const evmFamilyOf = (p: string): EvmFamily => {
  const m = /^(?:contracts|query|react)\/(lock|distributor)(?:\/|$)/.exec(p)
  return m?.[1] === "lock" ? "lock" : m?.[1] === "distributor" ? "distributor" : "infra"
}
for (const abs of files) {
  if (!abs.startsWith(AIRDROP_EVM_SRC + sep)) continue
  const srcRel = toPosix(relative(AIRDROP_EVM_SRC, abs))
  if (evmFamilyOf(srcRel) !== "lock") continue // only lock has an outbound limit
  const src = readFileSync(abs, "utf8")
  for (const spec of [...src.matchAll(SPECIFIER_RE)].map((mm) => mm[1])) {
    if (!spec.startsWith(".")) continue // package/own-door specifier resolves to a barrel
    const targetRel = toPosix(relative(AIRDROP_EVM_SRC, resolve(dirname(abs), spec)))
    if (evmFamilyOf(targetRel) === "distributor") {
      violations.push(
        `packages/airdrop-evm/src/${srcRel}: airdrop-evm family law — the lock family must not import the distributor family, incl. distributor/strategies (offending: "${spec}")`,
      )
    }
  }
}

// ---- airdrop-solana family law ---------------------------------------------
// Symmetric with the airdrop-evm law above, INSIDE packages/airdrop-solana/src:
// the lock family (a clique-lock stream escrow — standalone on-chain) must NEVER
// import the distributor family (the merkle-distributor claim gate + its strategy
// attachments under distributor/strategies). Family = the second path segment
// under a tri-layer folder (same rule as airdrop-evm); only RELATIVE specifiers
// are classified. distributor→lock stays unrestricted.
const AIRDROP_SOLANA_SRC: string = join(ROOT, "packages", "airdrop-solana", "src")
const solanaFamilyOf = (p: string): EvmFamily => {
  const m = /^(?:contracts|query|react)\/(lock|distributor)(?:\/|$)/.exec(p)
  return m?.[1] === "lock" ? "lock" : m?.[1] === "distributor" ? "distributor" : "infra"
}
for (const abs of files) {
  if (!abs.startsWith(AIRDROP_SOLANA_SRC + sep)) continue
  const srcRel = toPosix(relative(AIRDROP_SOLANA_SRC, abs))
  if (solanaFamilyOf(srcRel) !== "lock") continue // only lock has an outbound limit
  const src = readFileSync(abs, "utf8")
  for (const spec of [...src.matchAll(SPECIFIER_RE)].map((mm) => mm[1])) {
    if (!spec.startsWith(".")) continue // package/own-door specifier resolves to a barrel
    const targetRel = toPosix(relative(AIRDROP_SOLANA_SRC, resolve(dirname(abs), spec)))
    if (solanaFamilyOf(targetRel) === "distributor") {
      violations.push(
        `packages/airdrop-solana/src/${srcRel}: airdrop-solana family law — the lock family must not import the distributor family, incl. distributor/strategies (offending: "${spec}")`,
      )
    }
  }
}

// (airdrop-sui has no standalone lock family — no lock/distributor law applies.)

// ---- report -------------------------------------------------------------------------
if (violations.length > 0) {
  violations.sort()
  console.error("")
  console.error(`chain boundary check FAILED — ${violations.length} violation(s):`)
  for (const v of violations) console.error(`  ${v}`)
  process.exit(1)
}

console.log(
  `chain boundaries OK — ${scanned} files scanned, ${usedExceptions.size} exceptions applied, 0 stale`,
)
