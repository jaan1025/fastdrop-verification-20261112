/**
 * Rust-like `match`: match a value against literal-pattern arms, like
 * `match x { 1 => …, "a" => …, _ => … }`. Each arm is a thunk (no value is
 * passed in — a literal pattern binds nothing, just as in Rust).
 *
 * ```ts
 * match(status, {
 *   200: () => "ok",
 *   404: () => "not found",
 *   500: () => "error",   // every member required — no wildcard
 * })
 * ```
 *
 * Exhaustive, like Rust: cover every value of the union — otherwise it is a
 * compile error. There is no `_` wildcard here; when a genuine catch-all is
 * needed use {@link matchPartial}. Fully generic over any string/number literal
 * union; no discriminant assumption.
 *
 * To bind a variant's data (Rust's `Enum::V { x } => …`), use a native `switch`
 * on the discriminant — TypeScript narrows each branch, which is the language's
 * own equivalent of a destructuring pattern. Pair it with {@link assertNever}.
 */
type Arms<K extends string | number, R> = { [P in K]: () => R }
type WildcardArms<K extends string | number, R> = Partial<Arms<K, R>> & {
  _: () => R
}

/**
 * Exhaustive scalar `match`: `arms` must supply a thunk for EVERY member of `K`.
 * No wildcard — the catch-all is split into {@link matchPartial} so chain-dispatch
 * leaf files can be lint-banned from the escape hatch (adding a chain must fail to
 * compile, never be silently swallowed by a `_` arm).
 */
export function match<K extends string | number, R>(value: K, arms: Arms<K, R>): R {
  const arm = arms[value]
  if (!arm) {
    throw new Error(`match: no arm for ${JSON.stringify(value)}`)
  }
  return arm()
}

/**
 * The ONLY wildcard form of {@link match}: a partial arm map plus a required
 * `_: () => R` catch-all. Use it where a real default is intended. It is
 * lint-banned from `-evm.ts` / `-solana.ts` leaf files because a wildcard there
 * would defeat the "add a chain → compile error" guarantee.
 *
 * ```ts
 * matchPartial(status, {
 *   404: () => "not found",
 *   _: () => "other",     // required catch-all
 * })
 * ```
 */
export function matchPartial<K extends string | number, R>(value: K, arms: WildcardArms<K, R>): R {
  const arm = (arms as Partial<Record<K, () => R>>)[value] ?? arms._
  return arm()
}

/**
 * Like {@link match}, but for a **discriminated union value**: dispatch on a
 * discriminant field and hand each arm the member already narrowed to that
 * variant — the data-bearing counterpart of `match` (Rust's `Enum::V { x } =>
 * …`). Replaces the `switch (x.kind) { … default: assertNever }` boilerplate
 * with one exhaustive expression.
 *
 * The discriminant field is always explicit — pass it as the second argument
 * (`"kind"`, `"status"`, `"type"`, …), before the arms. There is no default:
 * the field a union keys on is load-bearing, so the call site states it. Putting
 * it before `arms` also fixes `D` first, so the arms object is checked against
 * the right variant set.
 *
 * ```ts
 * matchUnion(funding.chain, "kind", {
 *   evm: (c) => <Evm chainId={c.chainNum} />,   // c: the evm member
 *   solana: (c) => <Sol mint={c.mint} />,       // c: the solana member
 * })
 *
 * matchUnion(rpcState, "status", {
 *   idle: () => null,
 *   ok: (s) => <Ok url={s.url} />,
 * })
 * ```
 *
 * Each arm is typed independently, so arms may return different shapes; the
 * result type is the union of every arm's return. Every variant value of the
 * discriminant MUST have an arm — adding one is a compile error at each call
 * site.
 *
 * For dispatch on a bare scalar with no per-variant data, use {@link match}.
 */
type Discriminant<T> = {
  [K in keyof T]-?: T[K] extends string | number ? K : never
}[keyof T]

type UnionArms<T, D extends keyof T, R> = {
  [V in T[D] & (string | number)]: (member: Extract<T, Record<D, V>>) => R
}

export function matchUnion<
  T extends Record<D, string | number>,
  D extends Discriminant<T>,
  const Arms extends UnionArms<T, D, unknown>,
>(value: T, discriminant: D, arms: Arms): ReturnType<Arms[T[D] & (string | number)]> {
  const arm = arms[value[discriminant] as keyof Arms] as unknown as (
    member: T,
  ) => ReturnType<Arms[T[D] & (string | number)]>
  return arm(value)
}

/**
 * Exhaustiveness guard for the tail of a native `switch`/`if` chain — passing a
 * non-`never` value is a compile error, so adding a variant lights up every
 * switch that forgot it.
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`)
}
