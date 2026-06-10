'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import ErrorBoundary from '../../components/ErrorBoundary';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { Tenant, Payment, PaginatedResponse } from '../../types';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tenant_id: '', amount: '', payment_date: '', period_start: '', period_end: '', years_covered: '1', payment_method: 'Bank Transfer', reference: '', notes: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      api.get<PaginatedResponse<Payment>>('/payments/'),
      api.get<PaginatedResponse<Tenant>>('/tenants/'),
    ]).then(([pRes, tRes]) => {
      setPayments(pRes.data.results);
      setTenants(tRes.data.results);
    }).catch(() => toast('Failed to load data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) setFormErrors({ ...formErrors, [e.target.name]: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSaving(true);
    try {
      const payload = {
        ...form,
        tenant_id: Number(form.tenant_id),
        amount: Number(form.amount),
        years_covered: Number(form.years_covered),
      };
      await api.post('/payments/', payload);
      toast('Payment recorded successfully', 'success');
      setShowForm(false);
      setForm({ tenant_id: '', amount: '', payment_date: '', period_start: '', period_end: '', years_covered: '1', payment_method: 'Bank Transfer', reference: '', notes: '' });
      const { data } = await api.get<PaginatedResponse<Payment>>('/payments/');
      setPayments(data.results);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: Record<string, string[] | string> } };
      const d = axiosError.response?.data;
      if (d) {
        const fe: Record<string, string> = {};
        for (const [k, v] of Object.entries(d)) fe[k] = Array.isArray(v) ? v[0] : v;
        setFormErrors(fe);
      } else {
        toast('Failed to record payment', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/payments/${id}/approve/`);
      toast('Payment approved', 'success');
      const { data } = await api.get<PaginatedResponse<Payment>>('/payments/');
      setPayments(data.results);
    } catch {
      toast('Failed to approve payment', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) return;
    setActionLoading(id);
    try {
      await api.post(`/payments/${id}/reject/`, { reason: rejectReason });
      toast('Payment rejected', 'success');
      setRejecting(null);
      setRejectReason('');
      const { data } = await api.get<PaginatedResponse<Payment>>('/payments/');
      setPayments(data.results);
    } catch {
      toast('Failed to reject payment', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const methodIcon = (m: string) => {
    const icons: Record<string, string> = { 'Bank Transfer': '🏦', 'Cash': '💵', 'Credit Card': '💳', 'Mobile Money': '📱', 'Cheque': '📝' };
    return icons[m] || '💰';
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'badge badge-warning',
      approved: 'badge badge-success',
      rejected: 'badge badge-danger',
    };
    return <span className={styles[status] || 'badge'}>{status}</span>;
  };

  return (
    <ErrorBoundary>
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Payments</h1>
          <p className="mt-1" style={{ color: 'var(--text-light)' }}>{payments.length} payment{payments.length === 1 ? '' : 's'} recorded</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Record Payment
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Record New Payment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Tenant *</label>
                <select name="tenant_id" value={form.tenant_id} onChange={handleChange} required>
                  <option value="">Select tenant...</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name} — {t.unit?.unit_number || t.unit_number}</option>)}
                </select>
                {formErrors.tenant_id && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{formErrors.tenant_id}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Amount (₦) *</label>
                  <input name="amount" type="number" value={form.amount} onChange={handleChange} required placeholder="1600000" />
                  {formErrors.amount && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{formErrors.amount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Payment Date *</label>
                  <input name="payment_date" type="date" value={form.payment_date} onChange={handleChange} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Period Start *</label>
                  <input name="period_start" type="date" value={form.period_start} onChange={handleChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Period End *</label>
                  <input name="period_end" type="date" value={form.period_end} onChange={handleChange} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Years Covered</label>
                  <input name="years_covered" type="number" min="1" value={form.years_covered} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Method</label>
                  <select name="payment_method" value={form.payment_method} onChange={handleChange}>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Reference</label>
                <input name="reference" value={form.reference} onChange={handleChange} placeholder="Transaction reference" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Optional notes..." />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setFormErrors({}); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
      ) : payments.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>No payments yet</h3>
          <p className="mb-4" style={{ color: 'var(--text-light)' }}>Record your first rent payment</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">Record Payment</button>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Tenant</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Amount</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Period</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Years</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Date</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Method</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Reference</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Status</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Proof</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-3 px-4">
                    <div className="font-medium" style={{ color: 'var(--text)' }}>{p.tenant?.name || p.tenant_name || '—'}</div>
                    <div className="text-xs" style={{ color: 'var(--text-light)' }}>{p.tenant?.unit?.unit_number || p.unit_number || ''}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold" style={{ color: 'var(--success)' }}>₦{Number(p.amount).toLocaleString()}</td>
                  <td className="py-3 px-4" style={{ color: 'var(--text-light)' }}>{p.period_start} — {p.period_end}</td>
                  <td className="py-3 px-4" style={{ color: 'var(--text-light)' }}>{p.years_covered} yr{p.years_covered > 1 ? 's' : ''}</td>
                  <td className="py-3 px-4" style={{ color: 'var(--text-light)' }}>{p.payment_date}</td>
                  <td className="py-3 px-4"><span className="badge badge-info">{methodIcon(p.payment_method)} {p.payment_method}</span></td>
                  <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-light)' }}>{p.reference || '—'}</td>
                  <td className="py-3 px-4">{statusBadge(p.status)}</td>
                  <td className="py-3 px-4">
                    {p.proof_url ? (
                      <a href={p.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline text-xs">View</a>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {p.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(p.id)}
                          disabled={actionLoading === p.id}
                          className="btn btn-primary text-xs disabled:opacity-50"
                        >
                          {actionLoading === p.id ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => { setRejecting(p.id); setRejectReason(''); }}
                          disabled={actionLoading === p.id}
                          className="btn btn-secondary text-xs disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejecting !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-2">Reject Payment</h3>
            <p className="text-sm text-gray-500 mb-4">Provide a reason for rejecting this payment.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
              placeholder="Reason for rejection..."
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejecting(null)} className="btn btn-secondary">Cancel</button>
              <button
                onClick={() => handleReject(rejecting)}
                disabled={!rejectReason.trim() || actionLoading === rejecting}
                className="btn btn-primary disabled:opacity-50"
              >
                {actionLoading === rejecting ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
    </ErrorBoundary>
  );
}
