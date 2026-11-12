export type StepRowStatus = "done" | "failed" | "awaiting" | "active" | "idle"

export function stepRowStatus<Step extends string>(
  stepId: Step,
  args: {
    completedSteps: readonly Step[]
    currentStep: Step | null
    error: { step: Step } | null
    awaitingStepId?: Step | null
  },
): StepRowStatus {
  const { completedSteps, currentStep, error, awaitingStepId } = args
  if (completedSteps.includes(stepId)) return "done"
  if (error?.step === stepId) return "failed"
  if (awaitingStepId === stepId) return "awaiting"
  if (currentStep === stepId && !error) return "active"
  return "idle"
}
