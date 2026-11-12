// Curated barrel for `@repo/airdrop-app-shared/providers`: the route-scope hook
// + its type, plus the chains/data sub-barrels for apps that compose the stack
// directly. ProviderStack lives on the `./app` subpath (its canonical home).
export { useRouteScope, type RouteScope } from "./use-route-scope"
export * from "./chains"
export * from "./data"
