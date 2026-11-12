import { cn } from "@repo/ui/lib/utils"

import { claimSteps, type ClaimStep } from "./claim-step"

export function ClaimProgress({ step }: { step: ClaimStep }) {
  const current = claimSteps.findIndex(({ id }) => id === step)
  const last = claimSteps.length - 1

  return (
    <ol className="flex w-full items-start justify-center" aria-label="Claim progress">
      {claimSteps.map(({ id, title }, index) => {
        const active = index === current
        const complete = index < current || current === last
        return (
          <li key={id} aria-current={active ? "step" : undefined}
            className="flex w-full max-w-32 min-w-0 flex-1 basis-0 flex-col items-center">
            <div className="flex w-full items-center justify-center gap-3" aria-hidden="true">
              <span className={cn("h-1 flex-1 rounded-r-sm", active || complete ? "bg-primary" : "bg-border", index === 0 && "invisible")} />
              <span className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border text-base sm:size-12 sm:text-lg",
                active || complete ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground",
              )}>
                {complete ? (
                  <svg className="size-4 sm:size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m20 6-11 11-5-5" /></svg>
                ) : index + 1}
              </span>
              <span className={cn("h-1 flex-1 rounded-l-sm", complete ? "bg-primary" : "bg-border", index === last && "invisible")} />
            </div>
            <span className={cn("mt-4 px-1 text-center text-sm sm:px-2", active ? "text-foreground" : "text-muted-foreground")}>{title}</span>
          </li>
        )
      })}
    </ol>
  )
}
