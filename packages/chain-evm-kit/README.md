# @repo/chain-evm-kit

Generic single-chain EVM wallet, transaction, and token primitives — the only package (besides `-evm` leaf files) permitted to import `wagmi` / `@reown/*`.

## Responsibility

Owns every generic EVM capability that is not Clique-contract-specific: wallet-stack initialisation (AppKit + wagmi config), supported-chain registry, ERC-20 and native-token reads/writes, transaction sending/confirming, explorer-link derivation, RPC validation, ABI error decoding/formatting, and the TOS-signer host for EVM wallets. Clique distributor/lock/lock-hook contracts live in `@repo/airdrop-evm`, not here.

## Layer & positioning

Sits above `@repo/acs-client`, `@repo/shared`, and `@repo/tos-signer-base` (its only workspace deps), and below `@repo/airdrop-evm` and `@repo/airdrop-app-shared`.

**Consumed by (upstream):**

- `@repo/airdrop-evm` — builds Clique contract clients on top of the kit's tx primitives and error-decoding DI seam (`ErrorAbis`)
- `@repo/airdrop-app-shared` — imports `./config` (wagmi init, supported-chains), `./react` hooks (wallet preflight, token ops), and `./utils` (explorer link, RPC validation) from `-evm` leaf files

## Boundary — what belongs here, what does NOT

- ✅ wagmi / `@reown/appkit` initialisation and config (`initAppKit`, `getWagmiConfig`)
- ✅ Supported EVM chain registry (`SUPPORTED_EVM_CHAINS`, `getSupportedEvmChain`)
- ✅ Generic ERC-20 and native-token pure functions and React hooks (read + write)
- ✅ Transaction send/confirm primitives (`walletTx`, `waitForTransactionReceipt`, Safe multisig detection)
- ✅ EVM error decoding/formatting and the `ErrorAbis` DI seam (without Clique-specific ABIs)
- ✅ RPC validation (`validateRpc`, `classifyRpcError`)
- ✅ TOS-signer host for EVM wallets (`./tos-signer`)
- ❌ **No Clique contract code** (distributor, lock, lock-hook — those live in `@repo/airdrop-evm`)
- ❌ **No `@solana/*` imports and no import of `@repo/chain-solana-kit`** — the two chain kits never import each other
- ❌ **No product/domain logic** (schedule codes, fee codec, batch status — those live in `@repo/airdrop-base` or higher)
- ❌ **No app-flow orchestration** (provider composition, auth hooks, claim flows — those live in `@repo/airdrop-app-shared`)
- ❌ No chain-classification logic — `resolveChainKind` / `isEvmChainId` belong exclusively in `@repo/acs-client`

## Public surface

| Subpath        | Exposes                                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `./config`     | `initAppKit`, `getWagmiConfig`, `SUPPORTED_EVM_CHAINS`, `getSupportedEvmChain`, `getViemChain`                                                                                                           |
| `./token`      | Pure ERC-20 read/write functions (`getBalance`, `getAllowance`, `approve`, `transfer`, `getTokenInfo`, …)                                                                                                |
| `./query`      | `queryOptions` / `mutationOptions` factories for all token ops + `evmKeys` / `erc20Keys` key factories (React-free)                                                                                      |
| `./react`      | Wallet preflight hooks (`usePreflight`, `useEnsureWalletConnected`, `useEnsureChainSwitched`, `useEnsureToSSigned`), ERC-20 + native token hooks, `useEvmPublicClient`, `useGetTransactionExplorerLink`  |
| `./tos-signer` | `EvmToSSigner` — the wagmi-backed TOS-signing host (implements the `@repo/tos-signer-base` interface)                                                                                                    |
| `./utils`      | `walletTx`, `detectEvmWalletKind`, `waitForTransactionReceipt`, `getTransactionExplorerLink`, `validateRpc`, `catchRevert`, `formatError`, `toUserError`, `GENERIC_ERROR_ABIS`, `isSmartContractAccount` |

## Invariants / red lines

- **Single-chain boundary.** `wagmi` and `@reown/*` may be imported ONLY inside this package and `-evm` leaf files. No cross-kit imports between `chain-evm-kit` and `chain-solana-kit`.
- **Error-decoding DI seam.** `GENERIC_ERROR_ABIS` is the kit's own catalog (standard EVM errors). Clique-specific ABIs are composed by `@repo/airdrop-evm` into `DEFAULT_ERROR_ABIS` — they do not belong here.
- **Chain classification lives in `@repo/acs-client`.** Never add `isSolana`-style ad-hoc sniffing here; use `resolveChainKind` from `@repo/acs-client`.
- **`./query` is React-free.** `queryOptions` factories and key factories only; hooks live in `./react`.
