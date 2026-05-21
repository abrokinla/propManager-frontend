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
  const [form, setForm] = useState({ tenant_id: '', amount: '', payment_date: '', month_for: '', payment_method: 'Bank Transfer', reference: '', notes: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
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
      const payload = { ...form, tenant_id: Number(form.tenant_id), amount: Number(form.amount) };
      await api.post('/payments/', payload);
      toast('Payment recorded successfully', 'success');
      setShowForm(false);
      setForm({ tenant_id: '', amount: '', payment_date: '', month_for: '', payment_method: 'Bank Transfer', reference: '', notes: '' });
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

  const methodIcon = (m: string) => {
    const icons: Record<string, string> = { 'Bank Transfer': '🏦', 'Cash': '💵', 'Credit Card': '💳', 'Mobile Money': '📱', 'Cheque': '📝' };
    return icons[m] || '💰';
  };

  return (
    <ErrorBoundary>
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-gray-500 mt-1">{payments.length} payment{payments.length === 1 ? '' : 's'} recorded</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Record Payment
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Record New Payment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant *</label>
                <select name="tenant_id" value={form.tenant_id} onChange={handleChange} required>
                  <option value="">Select tenant...</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name} — {t.unit?.unit_number || t.unit_number}</option>)}
                </select>
                {formErrors.tenant_id && <p className="text-red-500 text-xs mt-1">{formErrors.tenant_id}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦) *</label>
                  <input name="amount" type="number" value={form.amount} onChange={handleChange} required placeholder="50000" />
                  {formErrors.amount && <p className="text-red-500 text-xs mt-1">{formErrors.amount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                  <input name="payment_date" type="date" value={form.payment_date} onChange={handleChange} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month For *</label>
                  <input name="month_for" type="month" value={form.month_for} onChange={handleChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <input name="reference" value={form.reference} onChange={handleChange} placeholder="Transaction reference" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
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
          <h3 className="font-semibold text-lg mb-2">No payments yet</h3>
          <p className="text-gray-500 mb-4">Record your first rent payment</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">Record Payment</button>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Tenant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Month</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Method</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Reference</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium">{p.tenant?.name || p.tenant_name || '—'}</div>
                    <div className="text-xs text-gray-500">{p.tenant?.unit?.unit_number || p.unit_number || ''}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-green-600">₦{Number(p.amount).toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-600">{p.month_for}</td>
                  <td className="py-3 px-4 text-gray-600">{p.payment_date}</td>
                  <td className="py-3 px-4"><span className="badge badge-info">{methodIcon(p.payment_method)} {p.payment_method}</span></td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{p.reference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
    </ErrorBoundary>
  );
}
