import * as React from "react"
import { ChevronRight } from "lucide-react"

import { cn } from "@repo/ui/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/components/collapsible"

/**
 * Tree / TreeItem — hierarchical expand/collapse file tree (DESIGN-SYSTEM.md
 * §10, new). Built on the forked Collapsible. Each row is h-8, indented 16px per
 * `level`, with an 8px-radius hover (one of the few non-square radii allowed). A
 * leading chevron rotates 90deg when open; leaf items (no `children`) drop it and
 * pad in its place. Recursive-friendly: nest `<TreeItem>`s as children, bumping
 * `level` by one each layer.
 */
function Tree({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="tree" role="tree" className={cn("flex flex-col", className)} {...props} />
}

type TreeItemProps = {
  label: React.ReactNode
  icon?: React.ReactNode
  defaultOpen?: boolean
  level?: number
  children?: React.ReactNode
}

function TreeItem({ label, icon, defaultOpen = false, level = 0, children }: TreeItemProps) {
  const indent = level * 16
  const hasChildren = React.Children.count(children) > 0

  const row = (
    <div
      className="text-foreground flex h-8 items-center gap-2 rounded-[var(--radius-tree)] pr-2 text-sm transition-colors hover:bg-[var(--hover-neutral)]"
      style={{ paddingLeft: indent + 8 }}
    >
      {hasChildren ? (
        <ChevronRight className="text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=open]/tree-item:rotate-90" />
      ) : (
        <span className="size-4 shrink-0" aria-hidden />
      )}
      {icon != null && (
        <span className="text-muted-foreground flex size-4 shrink-0 items-center justify-center">
          {icon}
        </span>
      )}
      <span className="truncate">{label}</span>
    </div>
  )

  if (!hasChildren) {
    return (
      <div data-slot="tree-item" role="treeitem">
        {row}
      </div>
    )
  }

  return (
    <Collapsible
      data-slot="tree-item"
      defaultOpen={defaultOpen}
      className="group/tree-item"
      role="treeitem"
    >
      <CollapsibleTrigger className="focus-visible:ring-ring w-full cursor-pointer text-left outline-none focus-visible:ring-2">
        {row}
      </CollapsibleTrigger>
      <CollapsibleContent role="group">{children}</CollapsibleContent>
    </Collapsible>
  )
}

export { Tree, TreeItem }
export type { TreeItemProps }
