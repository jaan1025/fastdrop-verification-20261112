import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@repo/ui/lib/utils"

export interface ToSMarkdownProps {
  /** Raw ToS markdown to render. */
  content: string
  className?: string
}

/**
 * Renders Terms-of-Service prose from markdown.
 *
 * Markdown styling uses explicit child-element utilities rather than the
 * Typography plugin's `prose-*` classes — `@tailwindcss/typography` is not
 * loaded in every consuming app, so `prose-*` would silently no-op there.
 * Keeping the rules self-contained makes this widget portable across apps.
 */
export function ToSMarkdown({ content, className }: ToSMarkdownProps) {
  return (
    <article
      className={cn(
        "text-foreground text-sm",
        "[&_h1]:font-display [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-medium [&_h1]:tracking-tight [&_h1]:first:mt-0",
        "[&_h2]:font-display [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:first:mt-0",
        "[&_h3]:font-display [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-sm [&_h3]:font-medium",
        "[&_p]:my-3 [&_p]:leading-relaxed [&_p]:first:mt-0 [&_p]:last:mb-0",
        "[&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline",
        "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_li]:marker:text-muted-foreground [&_li]:my-1 [&_li]:leading-relaxed",
        "[&_strong]:font-medium",
        "[&_hr]:border-border [&_hr]:my-6",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </article>
  )
}
