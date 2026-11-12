# `wallet-tx/` — the wallet-kind-aware transaction pipeline

The layer that answers: _given an already-signed transaction and whatever wallet
the user connected, how do we get it on chain and know it truly landed?_
Different wallet kinds answer differently (an EOA-style wallet's tx IS the
on-chain tx; a SquadsX multisig submits a **proposal** that executes later as a
**different** tx), so this layer exists to hide that variance behind one
handle-based API:

```
walletTx.send(…)           → SolanaTxHandle          (kind-tagged)
walletTx.confirm(handle)   → final on-chain signature
walletTx.sendAndConfirm(…) → both in one call
```

Below it: the signature-level primitives (`../confirm.ts`, `simulate`, `budget`,
`lut`). Above it: the `/react` hooks. Mirrored by the EVM kit's
`wallet-tx/{eoa,safe}` — keep the two kits conceptually parallel and
cross-reference the sibling in comments.

## The two-level layout rule

```
wallet-tx/
  types.ts            SolanaWalletKind + SolanaTxHandle (discriminated on `kind`)
  detect.ts           detectSolanaWalletKind — kind precedence lives HERE
  send.ts confirm.ts send-and-confirm.ts index.ts
                      kind-agnostic dispatch (exhaustive matchUnion on `kind`)
  <kind>/             one folder per wallet kind
    index.ts          barrel: the strategy trio (detect predicate, <kind>Send,
                      <kind>Confirm) — all a dispatcher may import
    send.ts confirm.ts
                      HANDLE-LEVEL adapters only: unwrap/wrap the handle,
                      delegate to primitives. Keep them thin.
    primitives/       the kind's raw domain machinery (only when non-trivial —
                      `standard/` has none, `squadsx/` has proposal submit +
                      PDA resolution, execution polling, message catalog).
                      Independently unit-testable; never imports the handle types.
```

The split is deliberate: **handle level speaks the pipeline's contract;
primitives speak the wallet's domain.** Naming follows suit — inside
`squadsx/primitives/` the vocabulary is Squads-native (`sendProposal`,
`waitForExecution`); the redundant qualifier only reappears at the public door
(`waitForMultisigExecution`, a door-stable alias — see below).

## Contracts every kind must honor

- **`<kind>Send(rpc, signed)`** — takes an ALREADY-SIGNED `SendableTransaction`;
  never re-signs, never mutates. Returns a handle carrying whatever identity the
  kind needs later (`standard`: the tx signature; `squadsx`: the
  proposal-creation signature).
- **`<kind>Confirm(handle, ctx)`** — resolves the handle to the FINAL effective
  on-chain signature (for a multisig that is the _execution_ tx, not the
  proposal) and finality-confirms it via the generic `../confirm` before
  returning. A caller holding the resolved signature may treat it as landed.
- **User-facing strings are pinned.** Every wait/timeout/submit-failure message
  is byte-asserted in characterization tests
  (`squadsx/primitives/{execution,proposal}.test.ts`). Rewording is a product
  decision: change the string AND its pin in the same diff, deliberately.
- **Multisig safety invariants.** Never create LUTs on the fly (`ensureTxFits`
  consumes provided LUTs only — an ALT warm-up slot cannot fit inside a Squads
  proposal cycle). Never assume `signMessage` exists (the commit-reveal path in
  `signing/` exists precisely because SquadsX lacks it).
- **No React, no UX side-effects, no chain-SDK leakage upward.** This layer is
  pure async functions over `@solana/kit`.
- **The `/transaction` door is published.** Additions are free; renames or
  removals of door-reachable symbols are BREAKING for out-of-repo consumers —
  make them deliberately. To rename an
  internal while keeping the door stable, alias at the kind barrel
  (`export { waitForExecution as waitForMultisigExecution }`) — that is the
  sanctioned pattern, not a compat shim.

## Checklist — adding a new wallet kind

1. **types.ts**: add the kind to `SolanaWalletKind` and give its handle variant
   the fields it needs. The compiler now flags every `matchUnion` that must grow
   an arm — follow the errors.
2. **`<kind>/`**: detect predicate + handle-level `send.ts`/`confirm.ts` +
   barrel; put real machinery in `<kind>/primitives/`. Model: `squadsx/`.
3. **detect.ts (dispatcher)**: insert the predicate at the right precedence —
   most specific first (a multisig adapter must win over `standard`). Order is
   behavior; test it.
4. **send.ts / confirm.ts (dispatchers)**: add the `matchUnion` arms.
5. **Tests**: characterize the kind's branch behavior with a fake `Rpc` +
   mocked `sleep` and byte-pin every user-facing string
   (`squadsx/primitives/execution.test.ts` is the model); for dispatcher wiring,
   mock at the module seam like `send-confirm.test.ts`.
6. **Doors**: expose only what consumers need, deliberately, via kind barrel →
   `wallet-tx/index.ts` → `transaction/index.ts`.
7. **EVM parity**: if the concept exists on the EVM side, keep the shape
   parallel with `chain-evm-kit/src/transaction/wallet-tx/` and cross-reference
   it in the module comment.
