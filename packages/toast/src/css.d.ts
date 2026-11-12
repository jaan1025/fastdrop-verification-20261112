// Side-effect CSS imports carry no runtime value. toast itself imports no CSS,
// but its `tsc` follows `@repo/markdown` into that package's raw `src`, which
// does `import "./styles/index.css"` — so the ambient module must exist in this
// program too (mirrors `packages/markdown/src/css.d.ts`).
declare module "*.css" {
  const content: string
  export default content
}
