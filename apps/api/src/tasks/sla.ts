import type { TaskPriority, TaskStatus } from '@prisma/client';

export type SlaState = 'met' | 'breached' | 'at_risk' | 'on_track' | 'none';

export interface SlaTask {
  status: TaskStatus;
  dueAt: Date | null;
  completedAt: Date | null;
}

/** A task is "at risk" once less than a quarter of its total window remains. */
export function slaState(task: SlaTask & { createdAt: Date }, now = new Date()): SlaState {
  if (!task.dueAt) return 'none';
  if (task.status === 'DONE') {
    return task.completedAt && task.completedAt <= task.dueAt ? 'met' : 'breached';
  }
  if (now > task.dueAt) return 'breached';
  const window = task.dueAt.getTime() - task.createdAt.getTime();
  const remaining = task.dueAt.getTime() - now.getTime();
  return window > 0 && remaining / window < 0.25 ? 'at_risk' : 'on_track';
}

const PRIORITY_HOURS: Record<TaskPriority, number> = { CRITICAL: 4, HIGH: 12, NORMAL: 24, LOW: 72 };

/** Default due date: the shorter of the board SLA and the priority target. */
export function defaultDueAt(priority: TaskPriority, boardSlaHours: number, from = new Date()): Date {
  const hours = Math.min(boardSlaHours, PRIORITY_HOURS[priority]);
  return new Date(from.getTime() + hours * 3_600_000);
}

export const OPEN_STATUSES: TaskStatus[] = ['OPEN', 'IN_PROGRESS', 'BLOCKED'];
