# @repo/components

Branded domain widgets built on `@repo/ui` primitives — the canonical single-right-answer compositions shared across all Clique product apps.

## Responsibility

Owns every reusable UI widget whose shape is fully determined: one correct layout, one correct set of props, no design decisions left to the caller. Examples: `<WalletAddress>` always truncates to 6+4 chars with a copy button; `<BatchStatusBadge>` always maps approval status to the canonical variant. If a composition carries a real design decision (when to use it, which layout to pick), it belongs in `@repo/patterns` as a spec instead.

## Layer & positioning

```
apps/* (vesting-console, airdrop-console, vesting-portal, superadmin, clique-signal, pass)
  └─ @repo/console-app-shared / @repo/airdrop-app-shared      ← consume @repo/components
       └─ @repo/components                                      ← THIS PACKAGE
            └─ @repo/ui            (shadcn primitives + tokens)
            └─ @repo/shared        (generic zero-dep utils)
            └─ @repo/acs-client    (wire model + chain classification)
            └─ @repo/airdrop-base  (product math: schedule, status, fee-codec)
            └─ @repo/tos-signer-base
```

Consumed directly by:

- `apps/vesting-console`, `apps/airdrop-console`, `apps/vesting-portal`, `apps/superadmin`, `apps/clique-signal`, `apps/pass`
- `packages/console-app-shared` (claim, deploy, distributor, funding, import, projects)
- `packages/airdrop-app-shared` (auth/login shell, wallet-control)
- `packages/patterns` (demo files only)

## Boundary — what belongs here, what does NOT

- ✅ Domain widgets with exactly one correct shape (no layout choices left to caller)
- ✅ Compositions of `@repo/ui` primitives + domain types from `@repo/acs-client` / `@repo/airdrop-base`
- ✅ Pure display helpers co-exported alongside their component (e.g. `resolveBatchBadgeStatus`, `stepRowStatus`)
- ❌ No chain SDK imports (`wagmi`, `@reown/*`, `@solana/*`) — chain-specific code lives in `@repo/chain-evm-kit` / `@repo/chain-solana-kit` and their consumers
- ❌ No `@repo/airdrop-app-shared` or `@repo/console-app-shared` imports — those layers are above; importing them would invert the dependency direction
- ❌ No app-flow orchestration (hooks with server state, Jotai atoms, navigation side-effects) — those belong in the app-shared layers or the apps themselves
- ❌ No compositions with real design decisions — if the caller must choose between layouts or usage contexts, write a pattern spec in `@repo/patterns` instead

## Public surface

Each subpath is a self-contained named export. Import by subpath:

```ts
import { WalletAddress } from "@repo/components/wallet-address"
import { DataTable, useDataTable, sortableHeader } from "@repo/components/data-table"
```

| Subpath                            | Exports                                                                                                                                                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `./actions-menu`                   | `ActionsMenu` — canonical header overflow menu (outline trigger + right-aligned dropdown)                                                                                                                 |
| `./async-tx-modal`                 | `AsyncTxModal` — confirm → signing → success/error lifecycle dialog for a single on-chain tx                                                                                                              |
| `./auth-form`                      | `AuthForm`, `AuthField`, `AuthNavLink`, `AuthBackLink` — email / SSO auth form column (Signal auth screens)                                                                                               |
| `./auth-split-panel`               | `AuthSplitPanel` — two-column auth shell: white form column + blue brand panel with a floating dashboard-preview stack                                                                                    |
| `./batch-status-badge`             | `BatchStatusBadge`, `resolveBatchBadgeStatus` — batch approval status → badge variant                                                                                                                     |
| `./chain-icon`                     | `ChainIcon` — blockchain network logo keyed by `chainId` string                                                                                                                                           |
| `./code-select`                    | `CodeSelect`, `CodeSelectItem` — multi-select combobox with chip display, keyed by string code                                                                                                            |
| `./confirm-dialog`                 | `ConfirmDialog` — AlertDialog confirmation with `default                                                                                                                                                  | warning | destructive` variants |
| `./copy-button`                    | `CopyButton` — ghost icon copy button with check-mark feedback                                                                                                                                            |
| `./copyable-value`                 | `CopyableValue` — short text + optional tooltip + copy button foundation                                                                                                                                  |
| `./create-preview-panel`           | `CreatePreviewPanel` — sticky live-summary card beside a create form                                                                                                                                      |
| `./data-panel`                     | `DataPanel` — borderless tinted container for supporting detail sections                                                                                                                                  |
| `./data-table`                     | `DataTable`, `DataTablePagination`, `DataTableSkeleton`, `sortableHeader`, `useDataTable`                                                                                                                 |
| `./detail-row`                     | `DetailRow`, `DetailList` — label↔value rows for aside panels and modal context blocks                                                                                                                    |
| `./disabled-reason`                | `DisabledReason` — wrap any standalone control so hovering it while disabled explains why                                                                                                                 |
| `./dropdown-menu-item-with-reason` | `DropdownMenuItemWithReason` — menu-item counterpart of `DisabledReason` (hover-reason on a disabled item)                                                                                                |
| `./error-fallback`                 | `ErrorFallback` — full-screen error-boundary fallback (icon + title + Retry / Go Home)                                                                                                                    |
| `./illustrations`                  | Illustration assets                                                                                                                                                                                       |
| `./login-dashboard-mock`           | `LoginDashboardMock` — data-driven light-dashboard mock for the login brand panel (top bar + sidebar + KPIs + table)                                                                                      |
| `./multi-step-progress-modal`      | `MultiStepProgressModal` — N-step async pipeline dialog (project / schedule create)                                                                                                                       |
| `./one-shot-toast`                 | `OneShotToast` — headless declarative toast that fires once when `when` turns true                                                                                                                        |
| `./refresh-button`                 | `RefreshButton` — refresh/retry button with spinning icon while `refreshing` is true                                                                                                                      |
| `./relative-time`                  | `RelativeTime` — relative label with absolute-timestamp tooltip                                                                                                                                           |
| `./schedule-panel`                 | `SchedulePanel`, `VestingCurvePanel` — canonical schedule detail surfaces; also exports the panel's label vocabulary (`formatScheduleDuration`, `formatUnlockSummary`)                                    |
| `./schedule-ref`                   | `ScheduleRef` — inline mono schedule code with tooltip + copy button                                                                                                                                      |
| `./widgets/*`                      | Signal design-system widgets — includes the consolidated `SectionHeading` (page + sub-group heading) and `StatCard` + `StatStrip` (stat cell + row); cataloged in the design-system `/widgets/*` showcase |
| `./step-checklist`                 | `StepChecklist`, `stepRowStatus` — vertical step list with done/active/awaiting/failed/idle states                                                                                                        |
| `./step-indicator`                 | `StepIndicator` — horizontal numbered step row for multi-step flows                                                                                                                                       |
| `./subpage-header`                 | `SubpageHeader`, `EntityTitle`, `EntityIdentifier` — responsive detail-page header                                                                                                                        |
| `./timestamp-value`                | `TimestampValue` — absolute UTC timestamp with copy button                                                                                                                                                |
| `./token-amount`                   | `TokenAmount` — amount + symbol + optional USD display                                                                                                                                                    |
| `./tos-dialog`                     | `TosDialog` — Terms of Service acceptance dialog                                                                                                                                                          |
| `./vesting-chart`                  | `VestingChart` — vesting curve chart (Recharts-backed); also exports its geometry (`scheduleToCurve`, `CurvePoint`)                                                                                       |
| `./vesting-progress-bar`           | `VestingProgressBar` — vesting progress visualization                                                                                                                                                     |
| `./wallet-address`                 | `WalletAddress` — truncated EIP-55 address with checksum tooltip + copy button                                                                                                                            |

## Invariants / red lines

- **Deps point down only.** This package may import from `@repo/ui`, `@repo/shared`, `@repo/acs-client`, `@repo/airdrop-base`, `@repo/tos-signer-base` — never from anything above (app-shared layers, apps).
- **No chain SDKs.** `wagmi`, `@reown/*`, `@solana/*` are strictly forbidden here. Chain-SDK code lives in the chain kits and their consumers.
- **One right answer.** Every component exported here must have a single canonical shape. When a composition requires design choices (layout options, usage-context rules), write a pattern spec in `@repo/patterns` and reference it from the component's JSDoc.
- **Pattern materialisations stay faithful.** Components that materialise a `@repo/patterns` spec (e.g. `AsyncTxModal` → `async-tx-modal/spec.md`, `ConfirmDialog` → `destructive-confirm/spec.md`) must satisfy every invariant in that spec's checklist.

---

## Component catalog

Domain-specific composite components for the Clique product family, built on
`@repo/ui` primitives.

These are _components_, not patterns: single-right-answer widgets with a
canonical shape (e.g., `<WalletAddress>` truncates to `6+4` chars with a copy
button). If a composition has a real design decision behind it, see
`@repo/patterns` instead.

### Current components

- `copyable-value` — foundational "short text + optional tooltip + copy button" composition. Caller passes the visible representation as children, the underlying string as `value` (what hits the clipboard), and optional `tooltip` content. Use directly for schedule codes, batch IDs, contract versions, and any other inline identifier that needs copy + optional context.
- `wallet-address` — truncated EIP-55 mono address with full-checksum tooltip + copy button. Thin wrapper over `copyable-value`.
- `schedule-ref` — inline mono schedule code with optional name-on-hover tooltip + copy button. Thin wrapper over `copyable-value`.
- `chain-icon` — branded blockchain network logo keyed by the project's `chainId` string. Backed by `@web3icons/react`. Falls back to a neutral placeholder for unknown chains.
- `token-amount` — amount + symbol + optional USD
- `batch-status-badge` — domain wrapper over `Badge` mapping a batch's approval `status` (`Pending` / `Approved` / `Rejected`) to copy + variant; a `Pending` batch reads "Pending Approval", and an `Approved` batch whose live `configuration` was cleared (`""`) reads "Revoked". Shared by both consoles' batch list/detail + the streams views + the superadmin project detail. Exports the pure `resolveBatchBadgeStatus(status, configuration?)` mapping for unit-testing without a renderer.
- `relative-time` — relative label with tooltip showing absolute timestamp
- `timestamp-value` — absolute UTC timestamp (`YYYY-MM-DD HH:mm:ss UTC`, mono) with a copy button that writes the ISO string. Backend timestamps are UTC, so they render in UTC (not the viewer's zone) to stay unambiguous. (The vesting "On first claim" fallback lives app-side in `vesting-start-timestamp-value`, not here.)
- `step-indicator` — horizontal numbered step row for multi-step flows
- `code-select` — controlled multi-select combobox keyed by a string `code` (Base UI `Combobox`, `multiple` + chips). Selected codes render as removable chips; the dropdown lists each item as `name` + mono `code` with an optional inline `tag`. Domain-agnostic: callers map their domain items to `CodeSelectItem` and own any `string[] ↔ "a:b"` composite-code conversion at the boundary.
- `detail-row` — label ↔ value row for aside panels, muted info blocks, consequence blocks. Label never wraps; value wraps (`break-words`) right-aligned; optional `copyValue` adds a copy button. Co-exports `DetailList` — a unified container that wraps a run of rows with shared spacing + optional hairline separators (`divided`, default `true`) so detail groups stop reinventing `space-y-*`.
- `copy-button` — ghost icon copy button with ~1.5s check-mark feedback; stops click propagation for use inside clickable rows/cards. Extracted from `copyable-value` (which now consumes it) so layout-owning callers (e.g. `detail-row`) can place just the button next to a wrapping value.
- `refresh-button` — refresh/retry button whose RefreshCw icon spins (and the button disables) while `refreshing` is true. Key it off the query's `isFetching`, not `isLoading` — keep-previous-data queries hide refetches from `isLoading`. Icon-only when no `label`.
- `step-checklist` — vertical step checklist (`done` / `active` / `awaiting` / `failed` / `idle`) with an optional generic per-step `trailing` slot (any `ReactNode` — e.g. a `@repo/ui` `ExternalLink` "View tx" — kept domain-free; the checklist knows nothing about its content). The shared row renderer behind `multi-step-progress-modal` and the airdrop interactive batch-approve modal. Pure `stepRowStatus` helper exported for status precedence (`done > failed > awaiting > active > idle`).
- `multi-step-progress-modal` — Dialog driving an N-step async pipeline (project / schedule create); composes `step-checklist` for its row rendering
- `one-shot-toast` — headless declarative toast that fires once when `when` first turns true (message / description / action / `info|success|warning|error` variant). Renders nothing; replaces the hand-rolled ref+effect for mount-time notices.
- `async-tx-modal` — Dialog driving the `confirm → signing → success / error` lifecycle for a single on-chain tx (claim, revoke, force-close). Materialises [`@repo/patterns/async-tx-modal`](../patterns/src/async-tx-modal/spec.md).
- `confirm-dialog` — AlertDialog-rooted blocking confirmation with `default | warning | destructive` variants. Materialises [`@repo/patterns/destructive-confirm`](../patterns/src/destructive-confirm/spec.md).
- `subpage-header` — responsive detail-page header (flex-wrap + `order`): back + title + actions inline at `sm`+, stacked on mobile (back/actions top row, title-block full-width below). Pass a router `<Link>` as `back` (cloned under `<Button asChild>`, arrow injected), `<EntityTitle>` as `title`, `<EntityIdentifier>` as `description`, `<ActionsMenu>` as `action`. Materialises [`@repo/patterns/subpage-header`](../patterns/src/subpage-header/spec.md).
- `entity-title` — canonical `<SubpageHeader title={…}>` composition: optional leading `<ChainIcon>` (size 22) + entity name (truncates on overflow) + optional trailing status badge node. The single right-answer replacement for hand-rolled `flex items-center gap-3` title rows on every detail header.
- `entity-identifier` — canonical `<SubpageHeader description={…}>` composition: `meta · children` (e.g. chain name + `<WalletAddress>` / `<ScheduleRef>`), middot-separated only when both sides are present. Either may be omitted independently.
- `actions-menu` — canonical header "Actions" overflow menu: an outline trigger button labelled "Actions" + `MoreHorizontalIcon`, opening a right-aligned `DropdownMenuContent`. Every detail header funnels ALL its actions into this one menu. Pass `<DropdownMenuItem>` / `<DropdownMenuSeparator>` (from `@repo/ui/components/dropdown-menu`) as children.
- `disabled-reason` — generic wrapper for any standalone control (Button, Link, icon button): pass `reason` and, while disabled, hovering surfaces it in a tooltip. Solves the gotcha that a natively-`disabled` element is `pointer-events-none` (no hover, no tooltip) by wrapping it in a `<span>` hover-target while the control keeps its native disabled styling. Gated on `reason` presence (undefined when actionable → children render untouched). For Radix dropdown menu items use `dropdown-menu-item-with-reason` instead (a menu item can't be span-wrapped). For permission-gated actions, hide via `PermissionGate` — don't disable.
- `dropdown-menu-item-with-reason` — the menu-item counterpart of `disabled-reason`: a drop-in for `<DropdownMenuItem>` inside an `ActionsMenu` that explains itself when disabled (pass `disabledReason`). A menu item can't be span-wrapped (it breaks Radix roving focus), so this renders it `aria-disabled` + inert + dimmed instead. Same use/avoid rules as `disabled-reason`.
- `widgets/section-heading` — the one accent-square `SectionHeading`: an 8×8 primary square + label, an optional muted `description` subtitle, a `default | destructive` variant, and `required` / `info` field-marker affordances. Covers both the page-level heading and the former `SectionMarker` sub-group role. Use `<CardTitle>` inside a Card. Cataloged at the design-system `/widgets/section-heading`.
- `error-fallback` — full-screen error-boundary fallback (icon + title + details + Retry / Go Home). Used as each app's root-route `errorComponent`.
- `widgets/stat-card` — the Signal `StatCard` stat cell (label + value + optional `secondary` / `unit` / `caption`, tone-colored number) and `StatStrip`, which composes cells into one collapsed-border unit — a single equal-width row by default, or the shared `@lg:2 @4xl:3 @7xl:4` responsive grid via `responsive`. Replaces the former bordered-`Card` `StatCard` + `StatCardGrid`. Cataloged at the design-system `/widgets/stat-card`.
- `data-panel` — borderless tinted container with an optional title and a content area, for tier-3 "supporting detail" sections (Schedule, Timeline, Identity) and, title-less, for modal context blocks. Pairs with bordered `StatCard` for hierarchy. Materialises [`@repo/patterns/data-panel`](../patterns/src/data-panel/spec.md).
- `schedule-panel` — canonical Schedule detail surfaces over a core `@repo/airdrop-base/schedule` `Schedule`, reused on Stream Detail & Schedule Detail across admin + portal. Exports two `DataPanel`-wrapped panels:
  - `SchedulePanel` — the "Schedule" label↔value config panel (`DataPanel` → `DetailList` → `DetailRow`): code/type, start–end phase, Vesting/Cliff/Total durations, start/cliff unlock %, and an optional `Lock contract` row. Duration formatting comes from `@repo/airdrop-base/schedule` (`formatScheduleDuration` for the Total row; `formatDurationCadence` for the Vesting/Cliff rows). `hideCode` suppresses the code row; `startTime`/`lockContract` override the start instant and add the lock address.
  - `VestingCurvePanel` — the "Vesting Curve" `DataPanel` wrapping `VestingChart`; `showProgress` draws a "Now" reference line when a start resolves.
- `create-preview-panel` — sticky live-summary card (Signal "Submission packet") beside a create form; `title` + children, sticky on `lg+`. Feed via `form.Subscribe`. Materialises [`@repo/patterns/create-with-live-preview`](../patterns/src/create-with-live-preview/spec.md).
- `data-table` — bundle of the canonical Data Table sub-parts. Materialises [`@repo/patterns/data-table`](../patterns/src/data-table/spec.md). Exports:
  - `DataTable` — the full table **shell** every table used to hand-roll (header map + body map + loading gate + pagination). Owns, in one place: first-load `DataTableSkeleton`, **header + body skeleton on paging/refetch** (`isFetching` — column widths frozen so nothing resizes, pagination + filters stay live, never a full-table flash), error `Alert` + Retry, the empty state, data rows (+ optional `onRowClick`), and pagination. Pass a `useDataTable` instance + states; callers reduce to columns + `<DataTable …/>`. Requires the page's query to use `placeholderData: keepPreviousData` so the prior page survives as the paging placeholder.
  - `DataTablePagination` — sliding-window numeric pagination; hides itself when `totalPages ≤ 1`; alignment is fixed center.
  - `sortableHeader(label, { align? })` — header factory returning a click-to-sort header renderer with the canonical chevron.
  - `DataTableSkeleton` — `<DataTableSkeleton rows />` loading placeholder; renders N row-height skeletons so the table doesn't shift when data arrives.
  - `useDataTable(options)` — the house `useReactTable` factory. Owns the single-column, 3-state sort contract (`enableMultiSort: false` + asc→desc→unsorted) and the core/sorted row models; switches between server sort (`manualSorting`, controlled) and built-in client sort by whether `onSortingChange` is passed. Everything else (`data`, `columns`, `getRowId`, `manualPagination`/`pageCount`) passes through.

Import pattern:

```ts
import { WalletAddress } from "@repo/components/wallet-address"
// barrel exports (subdirectory + index)
import {
  DataTablePagination,
  DataTableSkeleton,
  sortableHeader,
  useDataTable,
} from "@repo/components/data-table"
```
