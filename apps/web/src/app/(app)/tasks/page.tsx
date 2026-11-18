'use client';

import { useState } from 'react';
import type { Page } from '@clearpath/shared-types';
import { useApi } from '@/hooks/useApi';
import { PageHeader } from '@/components/PageHeader';
import { QueryBoundary } from '@/components/QueryBoundary';
import { TaskBoard } from '@/components/TaskBoard';

interface Board { id: string; name: string; slaHours: number }

export default function TasksPage() {
  const boards = useApi<Page<Board>>('/task-boards', { pageSize: 50 });
  const [selected, setSelected] = useState('');
  return (
    <>
      <PageHeader title="Clinical task boards" subtitle="Discharge planning, referral follow-up and authorization work" />
      <QueryBoundary state={boards}>
        {(page) => {
          const active = selected || page.items[0]?.id;
          return (
            <>
              <div className="cp-row">
                {page.items.map((b) => (
                  <button key={b.id} className={`cp-btn${b.id === active ? '' : ' cp-btn--ghost'}`} onClick={() => setSelected(b.id)}>
                    {b.name} · {b.slaHours}h SLA
                  </button>
                ))}
              </div>
              {active ? <TaskBoard boardId={active} /> : <p className="cp-empty">No boards have been created yet.</p>}
            </>
          );
        }}
      </QueryBoundary>
    </>
  );
}
