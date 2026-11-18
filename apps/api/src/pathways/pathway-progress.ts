export interface StepLike {
  position: number;
  dueAfterDays: number;
}

export function progressPercent(currentStep: number, totalSteps: number, completed: boolean): number {
  if (totalSteps <= 0) return 0;
  if (completed) return 100;
  return Math.round(((currentStep - 1) / totalSteps) * 100);
}

/** Cumulative due date: each step is due `dueAfterDays` after the previous one. */
export function stepDueDate(startedAt: Date, steps: StepLike[], position: number): Date | null {
  const ordered = [...steps].sort((a, b) => a.position - b.position);
  if (!ordered.some((s) => s.position === position)) return null;
  const days = ordered.filter((s) => s.position <= position).reduce((sum, s) => sum + s.dueAfterDays, 0);
  return new Date(startedAt.getTime() + days * 86_400_000);
}

export function nextPosition(currentStep: number, steps: StepLike[]): number | null {
  const later = steps.map((s) => s.position).filter((p) => p > currentStep).sort((a, b) => a - b);
  return later.length ? later[0] : null;
}
