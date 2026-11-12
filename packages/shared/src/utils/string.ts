// Generic, chain-free scalar string transforms for the display boundary. Zero
// runtime deps — the word-split + case conversions below are a faithful in-repo
// port of es-toolkit@1.45.1 (`words`/`camelCase`/`snakeCase`), so the package
// carries no es-toolkit dependency. Distinct from `object.ts` (recursive key-case
// transforms over objects): this file owns the scalar string helpers.

/** Uppercase the first character, leaving the rest unchanged. Returns the input
 *  unchanged when empty. */
export const capitalize = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

// --- word-split + case conversion (vendored from es-toolkit@1.45.1) -----------

// Splits a string into case-conversion "words": a capitalized or lowercase run,
// a digit run, an acronym (uppercase run not followed by a lowercase), an emoji,
// or any other Unicode-letter run. Verbatim from es-toolkit's `CASE_SPLIT_PATTERN`.
const CASE_SPLIT_PATTERN =
  /\p{Lu}?\p{Ll}+|[0-9]+|\p{Lu}+(?!\p{Ll})|\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{L}+/gu

/** Split `str` into its constituent words (es-toolkit `words`). */
export const words = (str: string): string[] => Array.from(str.match(CASE_SPLIT_PATTERN) ?? [])

// es-toolkit's `capitalize` semantics — uppercase the first char AND lowercase
// the rest (so acronym words collapse: `URL` → `Url`). Deliberately different
// from the exported `capitalize` above, which preserves the tail. Kept private.
const capitalizeWord = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()

/**
 * Any case (`snake_case` / `kebab-case` / `PascalCase` / acronym) → `camelCase`.
 * Faithful port of es-toolkit's `camelCase`: split into words, lowercase the
 * first, capitalize the rest. Acronyms collapse (`HTTPStatus` → `httpStatus`),
 * leading/duplicate separators are dropped (`__typename` → `typename`), and a
 * `_<digit>` boundary joins (`chain_id_2` → `chainId2`). Empty/separator-only
 * input → `''`.
 */
export const camelCase = (str: string): string => {
  const parts = words(str)
  if (parts.length === 0) return ""
  const [first = "", ...rest] = parts
  return first.toLowerCase() + rest.map(capitalizeWord).join("")
}

/**
 * Any case → `snake_case`. Faithful port of es-toolkit's `snakeCase`: split into
 * words, lowercase each, join with `_`.
 */
export const snakeCase = (str: string): string =>
  words(str)
    .map((word) => word.toLowerCase())
    .join("_")

// --- English pluralization ----------------------------------------------------

/**
 * English pluralization. Count `1` takes the singular form; everything else
 * (zero, two, many, negative, non-integer, `NaN`) takes the plural. For
 * irregular plurals the caller passes the explicit plural form.
 */
export const pluralize = (count: number, singular: string, plural?: string): string =>
  count === 1 ? singular : (plural ?? `${singular}s`)

/**
 * Count + word with `count.toLocaleString()` formatting. Use for any visible
 * "N items" string in the UI to avoid "1 items" / "1 recipients" bugs.
 */
export const countLabel = (count: number, singular: string, plural?: string): string =>
  `${count.toLocaleString()} ${pluralize(count, singular, plural)}`
