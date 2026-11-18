import { StatusBadge, toneForStatus } from '@clearpath/ui';
import type { TaskCard as TaskCardData, TaskStatus } from '@clearpath/shared-types';
import { TASK_COLUMNS } from '@clearpath/shared-types';
import { formatDateTime, titleCase } from '@/lib/format';

export function TaskCard({ task, onMove }: { task: TaskCardData; onMove: (id: string, status: TaskStatus) => void }) {
  const overdue = task.dueAt && task.status !== 'DONE' && new Date(task.dueAt) < new Date();
  return (
    <article className="cp-task">
      <header>
        <strong>{task.title}</strong>
        <StatusBadge tone={toneForStatus(task.priority)}>{titleCase(task.priority)}</StatusBadge>
      </header>
      <p className={overdue ? 'cp-text-danger' : 'cp-muted'}>Due {formatDateTime(task.dueAt)}{overdue ? ' (overdue)' : ''}</p>
      <p className="cp-muted">{task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}</p>
      <label className="cp-select">
        <span className="cp-sr-only">Move task</span>
        <select value={task.status} onChange={(e) => onMove(task.id, e.target.value as TaskStatus)}>
          {TASK_COLUMNS.map((c) => (
            <option key={c.status} value={c.status}>{c.label}</option>
          ))}
        </select>
      </label>
    </article>
  );
}
