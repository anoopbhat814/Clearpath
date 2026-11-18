'use client';

import type { Page, TaskCard as TaskCardData, TaskStatus } from '@clearpath/shared-types';
import { TASK_COLUMNS } from '@clearpath/shared-types';
import { useApi } from '@/hooks/useApi';
import { usePolling } from '@/hooks/usePolling';
import { api } from '@/lib/api';
import { QueryBoundary } from './QueryBoundary';
import { TaskCard } from './TaskCard';

export function TaskBoard({ boardId }: { boardId: string }) {
  const state = useApi<Page<TaskCardData>>('/tasks', { boardId, pageSize: 100 });
  usePolling(state.reload);

  async function move(id: string, status: TaskStatus) {
    await api.patch(`/tasks/${id}/status`, { status });
    state.reload();
  }

  return (
    <QueryBoundary state={state}>
      {(page) => (
        <div className="cp-board">
          {TASK_COLUMNS.map((col) => {
            const tasks = page.items.filter((t) => t.status === col.status);
            return (
              <section key={col.status} className="cp-board__col" aria-label={col.label}>
                <h3>{col.label} <span className="cp-muted">({tasks.length})</span></h3>
                {tasks.map((t) => (
                  <TaskCard key={t.id} task={t} onMove={move} />
                ))}
              </section>
            );
          })}
        </div>
      )}
    </QueryBoundary>
  );
}
