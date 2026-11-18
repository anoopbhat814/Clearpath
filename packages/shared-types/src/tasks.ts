export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface TaskCard {
  id: string;
  boardId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  assignee: { id: string; firstName: string; lastName: string } | null;
}

export const TASK_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'OPEN', label: 'To do' },
  { status: 'IN_PROGRESS', label: 'In progress' },
  { status: 'BLOCKED', label: 'Blocked' },
  { status: 'DONE', label: 'Done' },
];
