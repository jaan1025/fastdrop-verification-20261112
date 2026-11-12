// merkle-distributor functions sub-barrel — the hand facade over the generated
// client. The claim assembly + orchestration core live in the nested `claim/`
// subfamily (analysis H3/M1); the weighted per-hook composition (encoders,
// consumed prediction, extra-blob assembler, lock + penalty builders) lives in
// `strategies/`. `compute-units.ts` is a claim-internal DI constant — not
// re-exported here (only `claim.ts` reads it directly), same as before the
// re-home.
export * from "./pda"
export * from "./fetch"
export * from "./fee"
export * from "./configurator"
export * from "./vault-allowance"
// strategies live at ../strategies (hoisted to mirror airdrop-evm); re-exported by the distributor root barrel.
export * from "./merkle"
export * from "./prepare-claim-extra"
export * from "./resolve-deployed-distributor"
