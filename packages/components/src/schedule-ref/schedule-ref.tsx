import { CopyableValue } from "../copyable-value"

export interface ScheduleRefProps {
  /** Schedule / configuration code — always shown as the visible mono text. */
  code: string
  /**
   * Human-readable schedule name. When present, surfaces in a tooltip on
   * hover; otherwise the tooltip is omitted entirely.
   */
  name?: string
  className?: string
}

/**
 * Inline schedule reference: mono code visible, name on hover, copy
 * affordance to the right. Thin domain wrapper over `<CopyableValue>` —
 * use this whenever a schedule (configuration) code appears inline.
 */
export function ScheduleRef({ code, name, className }: ScheduleRefProps) {
  return (
    <CopyableValue value={code} tooltip={name} copyLabel="Copy schedule code" className={className}>
      <span className="font-mono text-xs">{code}</span>
    </CopyableValue>
  )
}
