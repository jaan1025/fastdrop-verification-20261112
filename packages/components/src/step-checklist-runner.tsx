import { ChecklistRow } from "./widgets/checklist-row"
import { cn } from "@repo/ui/lib/utils"

export type StepStatus = "done" | "running" | "pending" | "skipped"

export interface ChecklistStep {
  /** Step name — Funnel-Sans-Medium 14/20, foreground. */
  title: string
  /** One-line supporting detail — caption, muted. */
  description?: string
  /** Current run state of the step. */
  status: StepStatus
  /** Right-hand status text (e.g. "Done · 1.6s" suffix, "1.0s / 12m", "--"). */
  meta?: string
  /** Neutral inline chip rendered after the title (e.g. "Not provided"). */
  tag?: string
}

/** Inline neutral pill rendered after a row title. Flat black/10 surface, text
 * at foreground @ 60% — mirrors the Figma "Not provided" inline tag (node
 * 380:364). Rounded-full per the chip law (the only rounded shape allowed). */
function InlineTag({ children }: { children: string }) {
  return (
    <span className="type-body-md text-foreground/60 inline-flex items-center rounded-full bg-[var(--chip-neutral)] px-2.5 py-1 font-normal">
      {children}
    </span>
  )
}

/** Right-rail status indicator for a step row.
 *  - done    → green-tint pill, success text ("Done · 1.6s")
 *  - skipped → neutral black/10 pill ("Not provided")
 *  - running/pending → plain foreground timing text ("1.0s / 12m 3s", "--")
 * All three render at 14/20 per Figma node 252:3274 (not caption 12px). */
function StepRowRight({ status, meta }: { status: StepStatus; meta?: string }) {
  if (status === "done") {
    return (
      <span className="bg-success-tint type-body-md text-success inline-flex items-center rounded-full px-2.5 py-1 font-normal">
        {meta ?? "Done"}
      </span>
    )
  }
  if (status === "skipped") {
    return (
      <span className="type-body-md text-foreground/60 inline-flex items-center rounded-full bg-[var(--chip-neutral)] px-2.5 py-1 font-normal">
        {meta ?? "Not provided"}
      </span>
    )
  }
  // running + pending: plain foreground text (e.g. "1.0s / 12m 3s", "--")
  return <span className="type-body-md text-foreground font-normal">{meta ?? "--"}</span>
}

/**
 * StepChecklistRunner — a task-run checklist: a vertical list of step rows
 * separated by 1px dividers (Figma "Signal", node 252:3274 / 252:3092). Each row
 * composes a {@link ChecklistRow}: a 20px status circle + medium-weight title
 * (with an optional inline neutral tag) + one-line muted description on the left,
 * against a right-hand status indicator (green-tint "Done" pill, foreground timing
 * text, neutral "Not provided" chip, or "--"). Drives the engine "Analyze" /
 * job-runner screens.
 *
 * Rows are flush — no outer box and no horizontal padding — matching the Figma
 * Signal layout where step rows sit on the page content edge, separated only by
 * 1px divider rules.
 */
export function StepChecklistRunner({ items }: { items: ChecklistStep[] }) {
  return (
    <div className="flex flex-col">
      {items.map((item, i) => (
        <ChecklistRow
          key={i}
          status={item.status}
          label={
            item.tag ? (
              <span className="inline-flex items-center gap-2">
                {item.title}
                <InlineTag>{item.tag}</InlineTag>
              </span>
            ) : (
              item.title
            )
          }
          sublabel={item.description}
          chip={<StepRowRight status={item.status} meta={item.meta} />}
          className={cn("py-4", i > 0 && "border-border border-t")}
        />
      ))}
    </div>
  )
}
