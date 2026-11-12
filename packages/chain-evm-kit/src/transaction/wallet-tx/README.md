# `wallet-tx/` (EVM) — wallet-kind-aware transaction pipeline

The EVM twin of the Solana kit's wallet-tx layer. **The canonical design doc —
layout rules, per-kind contracts, and the add-a-wallet checklist — lives at
`packages/chain-solana-kit/src/transaction/wallet-tx/README.md`.** Keep the two
kits structurally parallel; this file only notes what is EVM-specific:

- Kinds: `eoa` | `safe` (`EvmTxHandle` discriminated on `kind`; dispatchers in
  `send.ts` / `confirm.ts` are exhaustive — adding a kind is a compile error
  until every arm exists).
- `eoa/` is the trivial kind: two one-line adapters over the shared primitives
  (`errors/catchRevert`, `transaction/receipt`) — the worked example of
  "no `primitives/` folder until the wallet has real domain machinery".
- `safe/` is the two-level example: handle-level trio at the top,
  `primitives/` holding the execution-event watcher (`waitForExecution`,
  door-aliased as `waitForSafeExecutionByEvent`), the composed confirm, and the
  `getThreshold()` detection probe. `safeSend` keeps its body — its fromBlock
  capture + revert-decoded broadcast IS the handle assembly (the raw submit
  primitive is the shared `catchRevert`).
- Safe-specific invariant: `confirm` resolves the handle to the ON-CHAIN
  execution tx (never the safeTxHash) and the failure throw embeds that
  on-chain hash — explorer links must point at something real.
