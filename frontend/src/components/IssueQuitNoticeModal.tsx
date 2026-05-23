'use client';

import { useState } from 'react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';
import type { Tenant } from '../types';

interface IssueQuitNoticeModalProps {
  tenant: Tenant;
  onClose: () => void;
  onIssued: () => void;
}

export default function IssueQuitNoticeModal({ tenant, onClose, onIssued }: IssueQuitNoticeModalProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const defaultEffective = new Date(today);
  defaultEffective.setMonth(defaultEffective.getMonth() + 3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/tenants/${tenant.id}/quit-notice/`, {
        effective_date: effectiveDate || defaultEffective.toISOString().split('T')[0],
        reason: reason || undefined,
      });
      toast('Quit notice issued successfully', 'success');
      onIssued();
      onClose();
    } catch {
      toast('Failed to issue quit notice', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md">
        <h2 className="text-lg font-semibold mb-2">Issue Quit Notice</h2>
        <p className="text-sm text-gray-500 mb-6">
          This will generate a formal quit notice for <strong>{tenant.name}</strong>.
          The notice will be sent via email and a document will be available for download.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={e => setEffectiveDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Defaults to 3 months from today ({defaultEffective.toISOString().split('T')[0]})
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Non-payment of rent, breach of agreement terms..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-700">
              This action has legal implications. The tenant will be formally notified of the
              termination of their tenancy. Ensure you have valid grounds before issuing.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-danger disabled:opacity-50">
              {saving ? 'Issuing...' : 'Issue Quit Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
