# Fastdrop Claim SPA

- Customize routes, components, styles, and assets as source code. `apps/claim/src/features/claim/claim-session.ts` describes the claim view contract. Compose a view with `ClaimRuntime`; use its actions for wallet, eligibility, quote, submission, and withdrawal.
- Campaign identity comes from the verified `fastdrop.json` binding. Keep chain-specific adapters and SDK calls in the runtime. Never copy an address or transaction instruction from a visual reference.
- Use demo mode for visual iteration. Run the narrowest checks that cover your edits, such as `pnpm --filter claim check-types`, `pnpm --filter claim lint`, or `pnpm --filter claim build`.
- The handoff is `apps/claim/dist/`. Keep routes usable with a static host's `index.html` fallback. Put request-time access policies outside the SPA.
