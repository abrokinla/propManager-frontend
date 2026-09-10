'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '../../../components/DashboardLayout';
import ErrorBoundary from '../../../components/ErrorBoundary';
import ConfirmDialog from '../../../components/ConfirmDialog';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import type { Unit, MaintenanceRequest, PaginatedResponse } from '../../../types';

export default function MaintenancePage() {
  const t = useTranslations('Maintenance');
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRequest | null>(null);
  const [form, setForm] = useState({ unit_id: '', title: '', description: '', priority: 'Medium', status: 'Open', reported_by: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [mRes, uRes] = await Promise.all([
        api.get<PaginatedResponse<MaintenanceRequest>>('/maintenance/'),
        api.get<PaginatedResponse<Unit>>('/units/'),
      ]);
      setRequests(mRes.data.results);
      setUnits(uRes.data.results);
    } catch {
      toast(t('toast.loadDataFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) setFormErrors({ ...formErrors, [e.target.name]: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSaving(true);
    try {
      const payload = { ...form, unit_id: Number(form.unit_id) };
      if (editing) {
        await api.put(`/maintenance/${editing.id}/`, payload);
        toast(t('toast.updated'), 'success');
      } else {
        await api.post('/maintenance/', payload);
        toast(t('toast.created'), 'success');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ unit_id: '', title: '', description: '', priority: 'Medium', status: 'Open', reported_by: '' });
      await fetchData();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: Record<string, string[] | string> } };
      const d = axiosError.response?.data;
      if (d) {
        const fe: Record<string, string> = {};
        for (const [k, v] of Object.entries(d)) fe[k] = Array.isArray(v) ? v[0] : v;
        setFormErrors(fe);
      } else {
        toast(t('toast.saveFailed'), 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (req: MaintenanceRequest) => {
    setEditing(req);
    setForm({
      unit_id: '',
      title: req.title,
      description: req.description,
      priority: req.priority,
      status: req.status,
      reported_by: req.reported_by || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/maintenance/${id}/`);
      toast(t('toast.deleted'), 'success');
      setRequests(requests.filter(r => r.id !== id));
    } catch {
      toast(t('toast.deleteFailed'), 'error');
    }
  };

  const priorityColor = (p: string) => p === 'High' ? 'badge-danger' : p === 'Medium' ? 'badge-warning' : 'badge-info';
  const statusColor = (s: string) => s === 'Open' ? 'badge-danger' : s === 'In Progress' ? 'badge-warning' : 'badge-success';

  const translatedPriority = (p: string) => {
    const map: Record<string, string> = { 'Low': t('form.low'), 'Medium': t('form.medium'), 'High': t('form.high') };
    return map[p] || p;
  };

  const translatedStatus = (s: string) => {
    const map: Record<string, string> = { 'Open': t('form.open'), 'In Progress': t('form.inProgress'), 'Completed': t('form.completed') };
    return map[s] || s;
  };

  return (
    <ErrorBoundary>
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{t('title')}</h1>
          <p className="mt-1" style={{ color: 'var(--text-light)' }}>{t('count', { count: requests.length })}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {t('newRequest')}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg">
            {editing ? (
              <>
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>{t('editForm.title')}</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-light)' }}>{t('editForm.property')}</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{editing.property_name || editing.unit?.property_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-light)' }}>{t('editForm.unit')}</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{editing.unit_number || editing.unit?.unit_number || '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-light)' }}>{t('editForm.title')}</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{editing.title}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-light)' }}>{t('editForm.description')}</p>
                    <p className="text-sm" style={{ color: 'var(--text)' }}>{editing.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-light)' }}>{t('editForm.reportedBy')}</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{editing.reported_by || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-light)' }}>{t('editForm.date')}</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{new Date(editing.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-light)' }}>{t('editForm.priority')}</p>
                      <span className={`badge ${priorityColor(editing.priority)}`}>{translatedPriority(editing.priority)}</span>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-0.5 block" style={{ color: 'var(--text-light)' }}>{t('editForm.status')}</label>
                      <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full">
                        <option value="Open">{t('form.open')}</option>
                        <option value="In Progress">{t('form.inProgress')}</option>
                        <option value="Completed">{t('form.completed')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn btn-secondary">{t('editForm.close')}</button>
                    <button
                      onClick={async () => {
                        setSaving(true);
                        try {
                          await api.patch(`/maintenance/${editing.id}/`, { status: form.status });
                          toast(t('toast.statusUpdated'), 'success');
                          setShowForm(false);
                          setEditing(null);
                          await fetchData();
                        } catch {
                          toast(t('toast.statusUpdateFailed'), 'error');
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                      className="btn btn-primary disabled:opacity-50"
                    >
                      {saving ? t('editForm.saving') : t('editForm.saveStatus')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>{t('createForm.title')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('form.unit')} *</label>
                    <select name="unit_id" value={form.unit_id} onChange={handleChange} required>
                      <option value="">{t('form.selectUnit')}</option>
                      {units.map(u => <option key={u.id} value={u.id}>{(u.property?.name || u.property_name || '—')} — {u.unit_number}</option>)}
                    </select>
                    {formErrors.unit_id && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{formErrors.unit_id}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('form.title')} *</label>
                    <input name="title" value={form.title} onChange={handleChange} required placeholder={t('form.titlePlaceholder')} />
                    {formErrors.title && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{formErrors.title}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('form.description')} *</label>
                    <textarea name="description" value={form.description} onChange={handleChange} required rows={3} placeholder={t('form.descriptionPlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('form.reportedBy')} *</label>
                    <input name="reported_by" value={form.reported_by} onChange={handleChange} required placeholder={t('form.reportedByPlaceholder')} />
                    {formErrors.reported_by && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{formErrors.reported_by}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('form.priority')}</label>
                      <select name="priority" value={form.priority} onChange={handleChange}>
                        <option value="Low">{t('form.low')}</option>
                        <option value="Medium">{t('form.medium')}</option>
                        <option value="High">{t('form.high')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('form.status')}</label>
                      <select name="status" value={form.status} onChange={handleChange}>
                        <option value="Open">{t('form.open')}</option>
                        <option value="In Progress">{t('form.inProgress')}</option>
                        <option value="Completed">{t('form.completed')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn btn-secondary">{t('form.cancel')}</button>
                    <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">{saving ? t('form.saving') : t('form.create')}</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
      ) : requests.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>{t('empty.title')}</h3>
          <p className="mb-4" style={{ color: 'var(--text-light)' }}>{t('empty.description')}</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">{t('empty.cta')}</button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{req.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-light)' }}>{(req.unit?.property_name || req.property_name || '—')} — {(req.unit?.unit_number || req.unit_number || '—')}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`badge ${priorityColor(req.priority)}`}>{translatedPriority(req.priority)}</span>
                  <span className={`badge ${statusColor(req.status)}`}>{translatedStatus(req.status)}</span>
                </div>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>{req.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-light)' }}>{t('card.reportedBy', { name: req.reported_by || '—' })} · {new Date(req.created_at).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(req)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">{t('actions.edit')}</button>
                  <button onClick={() => setDeleteTarget(req.id)} className="text-sm font-medium" style={{ color: 'var(--danger)' }}>{t('actions.delete')}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('deleteModal.title')}
        message={t('deleteModal.message')}
        onConfirm={() => {
          const id = deleteTarget!;
          setDeleteTarget(null);
          return handleDelete(id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
    </ErrorBoundary>
  );
}
