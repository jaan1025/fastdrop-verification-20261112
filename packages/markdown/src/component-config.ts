import { createElement, type CSSProperties, type ReactElement } from "react"
import type { Components } from "react-markdown"

/**
 * Join class-name parts with a single space, dropping falsy values. Used for
 * the wrapper's `prose max-w-full` base plus an optional caller className.
 * Kept dependency-free (mono reached for `cn` from `@airdrop/ui/utils`, but the
 * one call here is a two-arg join with no Tailwind conflict to dedupe).
 */
export function joinClassName(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(" ")
}

/**
 * Default attributes injected per HTML tag before caller/node props.
 *
 * Every rendered `<a>` opens in a new tab with `rel="noopener noreferrer"`
 * so untrusted link targets can never reach `window.opener`. Callers can
 * still override these by emitting the attribute in the source markdown
 * (node props win over defaults — see {@link buildElementProps}).
 */
export const DEFAULT_ELEMENT_ATTRS: Record<string, Record<string, unknown>> = {
  a: {
    target: "_blank",
    rel: "noopener noreferrer",
  },
}

/**
 * The set of tags that need a custom wrapper: the union of tags carrying
 * default attributes and tags the caller supplied inline styles for,
 * deduplicated preserving first-seen order. Only these tags get a wrapper;
 * every other tag renders with react-markdown's defaults.
 */
export function buildComponentKeys(
  defaultAttrs: Record<string, Record<string, unknown>>,
  styles: Record<string, CSSProperties> | undefined,
): string[] {
  return Array.from(new Set([...Object.keys(defaultAttrs), ...Object.keys(styles ?? {})]))
}

/**
 * Inline-style precedence for a rendered element:
 * default-attr style < per-node style < caller-supplied style.
 * A later source overrides an earlier one on a per-property basis.
 */
export function mergeElementStyle(
  defaultStyle: CSSProperties | undefined,
  nodeStyle: CSSProperties | undefined,
  callerStyle: CSSProperties | undefined,
): CSSProperties {
  return {
    ...defaultStyle,
    ...nodeStyle,
    ...callerStyle,
  }
}

/**
 * Assemble the final props for one mapped element, preserving the mono
 * spread order exactly:
 *   1. merged `style` (default < node < caller)
 *   2. remaining default attrs (e.g. target/rel) — override nothing yet
 *   3. node props (href, children, className, …) — win over default attrs
 *
 * Consequence: markdown that emits its own `target`/`rel`/etc. overrides the
 * injected default, while a caller `styles[tag]` still wins the `style` merge.
 */
export function buildElementProps(
  defaultAttr: Record<string, unknown> | undefined,
  nodeStyle: CSSProperties | undefined,
  callerStyle: CSSProperties | undefined,
  nodeProps: Record<string, unknown>,
): Record<string, unknown> {
  const { style: defaultStyle, ...restDefaultAttr } = (defaultAttr ?? {}) as {
    style?: CSSProperties
  } & Record<string, unknown>

  return {
    style: mergeElementStyle(defaultStyle, nodeStyle, callerStyle),
    ...restDefaultAttr,
    ...nodeProps,
  }
}

/**
 * Build the react-markdown `components` map from the default attrs and caller
 * styles. Each mapped tag renders via {@link buildElementProps} so link
 * defaults, per-node styles, and caller overrides compose identically to mono.
 */
export function buildComponents(
  defaultAttrs: Record<string, Record<string, unknown>>,
  styles: Record<string, CSSProperties> | undefined,
): Components {
  const keys = buildComponentKeys(defaultAttrs, styles)

  return keys.reduce<Components>((acc, key) => {
    const Element = ({
      node: _node,
      style,
      ...rest
    }: {
      node?: unknown
      style?: CSSProperties
    } & Record<string, unknown>): ReactElement => {
      return createElement(key, buildElementProps(defaultAttrs[key], style, styles?.[key], rest))
    }
    // react-markdown keys are HTML tag names; the wrapper signature is
    // intentionally loose (any intrinsic tag), so cast through the map value.
    return { ...acc, [key]: Element as Components[keyof Components] }
  }, {})
}
