import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@repo/ui/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn("group/tabs flex gap-2 data-[orientation=horizontal]:flex-col", className)}
      {...props}
    />
  )
}

// clique-style tabs: flat underline. A hairline baseline (border) runs under the
// tabs; the active tab is marked by a blue underline (a left bar in vertical
// orientation). No pill, no fill, no shadow, sharp corners.
function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "text-muted-foreground flex",
        "group-data-[orientation=horizontal]/tabs:w-fit group-data-[orientation=horizontal]/tabs:items-center group-data-[orientation=horizontal]/tabs:border-b",
        "group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:border-l",
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "text-muted-foreground hover:text-foreground focus-visible:text-foreground data-[state=active]:text-foreground inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-normal whitespace-nowrap transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Active marker pulled onto the list's baseline so it sits flush:
        // a blue bottom border (horizontal) / left border (vertical).
        "group-data-[orientation=horizontal]/tabs:data-[state=active]:border-primary group-data-[orientation=horizontal]/tabs:-mb-px group-data-[orientation=horizontal]/tabs:border-b-2 group-data-[orientation=horizontal]/tabs:border-transparent",
        "group-data-[orientation=vertical]/tabs:data-[state=active]:border-primary group-data-[orientation=vertical]/tabs:-ml-px group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start group-data-[orientation=vertical]/tabs:border-l-2 group-data-[orientation=vertical]/tabs:border-transparent",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
