import { useMemo, type CSSProperties, type HTMLAttributes } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { DEFAULT_ELEMENT_ATTRS, buildComponents, joinClassName } from "./component-config"
import "./styles/index.css"

// https://remarkjs.github.io/react-markdown/

export interface MarkdownContentProps {
  children: string
  styles?: Record<string, CSSProperties>
  className?: HTMLAttributes<HTMLDivElement>["className"]
  style?: HTMLAttributes<HTMLDivElement>["style"]
}

/**
 * Renders a Markdown string as themed prose.
 *
 * SECURITY: `rehype-raw` passes raw inline HTML in the source markdown straight
 * through to the DOM — this is an XSS surface. Only render markdown from a
 * trusted source, or sanitize upstream before handing it to this component.
 */
export const MarkdownViewer = (props: MarkdownContentProps) => {
  const { children, styles, className, style } = props

  const components = useMemo(() => buildComponents(DEFAULT_ELEMENT_ATTRS, styles), [styles])

  return (
    <div className={joinClassName("prose max-w-full", className)} style={style}>
      <ReactMarkdown
        remarkPlugins={[[remarkGfm]]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
