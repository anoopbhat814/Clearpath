'use client';

import { useEffect, useRef } from 'react';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog ref={ref} className="cp-dialog" onCancel={onCancel}>
      <h2>{title}</h2>
      <p>{message}</p>
      <div className="cp-row">
        <button className="cp-btn cp-btn--ghost" onClick={onCancel}>Cancel</button>
        <button className="cp-btn" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}
