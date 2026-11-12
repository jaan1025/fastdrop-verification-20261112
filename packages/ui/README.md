# @repo/ui

Thin shadcn/Tailwind primitives plus the design tokens and theme — the single source of truth for all visual foundations in this monorepo.

## Responsibility

Owns two things and nothing else:

1. **Design tokens and theme** — CSS custom properties (`tokens.css`), Tailwind v4 `@theme` mapping (`theme.css`), base component styles (`components.css`), and the Funnel Sans / Funnel Display font imports. Every color, radius, font, and semantic surface variable is declared here and here only.
2. **Primitive UI components** — the shadcn/radix component set (Button, Dialog, Table, Sidebar, etc.) plus a handful of custom but domain-agnostic primitives (Field, FieldGroup, Page, Spinner, Empty, ExternalLink, LoadingButton, …). All components are stateless, unstyled at the domain level, and carry zero business logic.

## Layer & positioning

```
@repo/ui                ← THIS PACKAGE (lowest UI layer)
    ↑
@repo/components        ← branded domain widgets (WalletAddress, StatusBadge, …)
@repo/tos-signer-base   ← dialog slot, host hook
@repo/airdrop-app-shared ← auth/login forms, wallet-control views
@repo/patterns          ← pattern spec demos
apps/*                  ← all product apps
```

`@repo/ui` sits at the bottom of the UI stack. It has no upward dependencies inside the monorepo — only external npm packages (radix-ui, base-ui, class-variance-authority, tailwind-merge, lucide-react, etc.) and React as a peer.

Known direct consumers (verified from source):

- `@repo/components` — builds all branded widgets on top of these primitives
- `@repo/tos-signer-base` — uses Dialog slot + host hook
- `@repo/airdrop-app-shared` — login forms, wallet-control, provider stack
- `@repo/patterns` — pattern spec demos
- All `apps/*` — import styles and components directly

## Boundary — what belongs here, what does NOT

- ✅ Tailwind v4 CSS tokens, theme mapping, font imports (`./styles/*`)
- ✅ Shadcn/radix component wrappers and custom domain-agnostic primitives (`./components/*`)
- ✅ `cn()` utility and `useMobile` hook (`./lib/*`, `./hooks/*`)
- ❌ **No domain code** — nothing that knows about airdrops, vesting, allocations, organizations, chains, or any product concept
- ❌ **No chain SDK** — no `wagmi`, no `@solana/*`, no `@reown/*`, not even `viem`
- ❌ **No imports from any other `@repo/*` package** — this is the bottom layer; importing upward is a dependency inversion
- ❌ **No business logic or server state** — no TanStack Query, no Jotai, no auth, no HTTP calls
- ❌ **No app-flow orchestration** — no router, no form engines, no multi-step flows

## Public surface

| Subpath                   | What it exposes                                                            |
| ------------------------- | -------------------------------------------------------------------------- |
| `./components/<name>`     | Individual primitive component file (one component per file, named export) |
| `./hooks/use-mobile`      | `useMobile()` — responsive breakpoint hook                                 |
| `./lib/utils`             | `cn()` — clsx + tailwind-merge helper                                      |
| `./styles/tokens.css`     | Raw CSS custom properties (colors, radius, chart palette)                  |
| `./styles/theme.css`      | Tailwind v4 `@theme` mapping + Funnel font imports                         |
| `./styles/components.css` | Base layer component styles                                                |

## Invariants / red lines

- **Apps must `@source` every `@repo/*` package they consume.** Tailwind v4 only scans explicitly declared paths — a class used inside an un-sourced package will silently no-op in production.
- **Fonts must be declared in both `packages/ui` and each consuming app** due to pnpm strict isolation. Do not assume the font is available transitively.
- **`tokens.css` is the single source of truth for semantic color values.** Never duplicate or override these variables inline in an app's CSS; always extend through the token layer.
- **No component in this package may import from any other `@repo/*` package.** Violations break the dependency direction and create circular dependency risks.

## Component catalog

| Component       | File                  |
| --------------- | --------------------- |
| Accordion       | `accordion.tsx`       |
| Alert           | `alert.tsx`           |
| Alert Dialog    | `alert-dialog.tsx`    |
| Aspect Ratio    | `aspect-ratio.tsx`    |
| Avatar          | `avatar.tsx`          |
| Badge           | `badge.tsx`           |
| Breadcrumb      | `breadcrumb.tsx`      |
| Button          | `button.tsx`          |
| Button Group    | `button-group.tsx`    |
| Calendar        | `calendar.tsx`        |
| Card            | `card.tsx`            |
| Carousel        | `carousel.tsx`        |
| Chart           | `chart.tsx`           |
| Checkbox        | `checkbox.tsx`        |
| Collapsible     | `collapsible.tsx`     |
| Combobox        | `combobox.tsx`        |
| Command         | `command.tsx`         |
| Context Menu    | `context-menu.tsx`    |
| Dialog          | `dialog.tsx`          |
| Direction       | `direction.tsx`       |
| Drawer          | `drawer.tsx`          |
| Dropdown Menu   | `dropdown-menu.tsx`   |
| Empty           | `empty.tsx`           |
| External Link   | `external-link.tsx`   |
| Field           | `field.tsx`           |
| Fields          | `fields.tsx`          |
| Hover Card      | `hover-card.tsx`      |
| Input           | `input.tsx`           |
| Input Group     | `input-group.tsx`     |
| Input OTP       | `input-otp.tsx`       |
| Item            | `item.tsx`            |
| Kbd             | `kbd.tsx`             |
| Label           | `label.tsx`           |
| Loading Button  | `loading-button.tsx`  |
| Menubar         | `menubar.tsx`         |
| Native Select   | `native-select.tsx`   |
| Navigation Menu | `navigation-menu.tsx` |
| Page            | `page.tsx`            |
| Pagination      | `pagination.tsx`      |
| Popover         | `popover.tsx`         |
| Progress        | `progress.tsx`        |
| Radio Group     | `radio-group.tsx`     |
| Resizable       | `resizable.tsx`       |
| Scroll Area     | `scroll-area.tsx`     |
| Select          | `select.tsx`          |
| Separator       | `separator.tsx`       |
| Sheet           | `sheet.tsx`           |
| Sidebar         | `sidebar.tsx`         |
| Skeleton        | `skeleton.tsx`        |
| Slider          | `slider.tsx`          |
| Sonner (toasts) | `sonner.tsx`          |
| Spinner         | `spinner.tsx`         |
| Switch          | `switch.tsx`          |
| Table           | `table.tsx`           |
| Tabs            | `tabs.tsx`            |
| Textarea        | `textarea.tsx`        |
| Toggle          | `toggle.tsx`          |
| Toggle Group    | `toggle-group.tsx`    |
| Tooltip         | `tooltip.tsx`         |
