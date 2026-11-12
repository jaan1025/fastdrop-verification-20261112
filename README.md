# Fastdrop Claim SPA

This workspace is a standalone TanStack Start claim app. Its routes and React components are the starting point for a custom site. The EVM and Solana wallet adapters, verified ACS binding, quote review, submission, and withdrawal stay in the claim runtime.

```bash
pnpm install --frozen-lockfile
pnpm --filter claim dev
pnpm --filter claim build
```

The default landing, theme, and four-step claim UI follow the `clique-airdrop-template-mono` claim app (`8f9f79f`). The claim step includes a quote review before submission; the same runtime supports EVM and Solana. Demo mode uses the same pages with sample allocations and no wallet providers.

To change the experience, edit `apps/claim/src/routes`, `src/features/claim-ui`, `src/styles`, and `public`. A route can supply any React view to `ClaimRuntime`:

```tsx
<ClaimRuntime>{(session) => <YourClaimPage session={session} />}</ClaimRuntime>
```

Use the `ClaimSession` type in `apps/claim/src/features/claim/claim-session.ts` for states and actions. The runtime chooses the chain and keeps the executable quote with its wallet and campaign. The view can arrange or style the steps without implementing proof, co-signing, or transaction construction.

The build exports `apps/claim/dist/` with `index.html` and browser assets. Serve assets first and rewrite navigation requests such as `/flow` to `index.html`. Apply any project-specific access restrictions and security headers at the host or backend. TanStack Start's prerender files are temporary and are discarded on a successful build.

The starter carries the verified Fastdrop SDK sources derived from the Clique Airdrop Portal snapshot (`c83f3c847ab80e45a72542e91f663dd9b850be16c0d7a9d9b793aa51ecbe6636`). `pnpm test` runs the retained claim and SDK unit checks.
