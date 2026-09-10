'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message, confirmLabel, cancelLabel,
  danger = true, onConfirm, onCancel,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const t = useTranslations('ConfirmDialog');
  const resolvedConfirmLabel = confirmLabel || t('delete');
  const resolvedCancelLabel = cancelLabel || t('cancel');

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn btn-secondary disabled:opacity-50"
          >
            {resolvedCancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={danger ? 'btn btn-danger disabled:opacity-50' : 'btn btn-primary disabled:opacity-50'}
          >
            {loading ? t('processing') : resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
