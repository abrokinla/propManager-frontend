'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import ErrorBoundary from '../../components/ErrorBoundary';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { Unit, Tenant, PaginatedResponse, TenancyStatus } from '../../types';

const tenancyStatusConfig: Record<TenancyStatus, { label: string; className: string }> = {
  invited: { label: 'Invited', className: 'badge-warning' },
  profile_pending: { label: 'Profile Pending', className: 'badge-warning' },
  document_pending: { label: 'Document Pending', className: 'badge-info' },
  pending_document: { label: 'Pending Document', className: 'badge-warning' },
  document_sent: { label: 'Document Sent', className: 'badge-info' },
  document_signed: { label: 'Document Signed', className: 'badge-info' },
  active: { label: 'Active', className: 'badge-success' },
  expired: { label: 'Expired', className: 'badge-danger' },
  quit_notice_issued: { label: 'Quit Notice', className: 'badge-danger' },
};

const defaultForm = {
  unit_id: '', name: '', phone: '', email: '', address: '',
  annual_rent: '', tenancy_status: 'invited' as TenancyStatus,
  lease_start_date: '', lease_renewal_date: '', lease_expiry_date: '',
  move_in_date: '', is_active: 'true',
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [sendingInvite, setSendingInvite] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      api.get<PaginatedResponse<Tenant>>('/tenants/'),
      api.get<PaginatedResponse<Unit>>('/units/'),
    ]).then(([tRes, uRes]) => {
      setTenants(tRes.data.results);
      setUnits(uRes.data.results);
    }).catch(() => toast('Failed to load data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        unit_id: Number(form.unit_id),
        annual_rent: form.annual_rent || null,
        is_active: form.is_active === 'true',
      };
      if (editing) {
        await api.put(`/tenants/${editing.id}/`, payload);
        toast('Tenant updated successfully', 'success');
      } else {
        await api.post('/tenants/', payload);
        toast('Tenant created. Invitation sent to ' + (payload.email || 'their email'), 'success');
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultForm);
      const { data } = await api.get<PaginatedResponse<Tenant>>('/tenants/');
      setTenants(data.results);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: Record<string, string[] | string> } };
      const data = axiosError.response?.data;
      if (data) {
        const fe: Record<string, string> = {};
        for (const [k, v] of Object.entries(data)) fe[k] = Array.isArray(v) ? v[0] : v;
        setFormErrors(fe);
      } else {
        toast('Failed to save tenant', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (t: Tenant) => {
    setEditing(t);
    setForm({
      unit_id: String(t.unit?.id || t.unit_id || ''),
      name: t.name, phone: t.phone, email: t.email, address: t.address || '',
      annual_rent: t.annual_rent ? String(t.annual_rent) : '',
      tenancy_status: t.tenancy_status,
      lease_start_date: t.lease_start_date || '', lease_renewal_date: t.lease_renewal_date || '',
      lease_expiry_date: t.lease_expiry_date || '', move_in_date: t.move_in_date || '',
      is_active: String(t.is_active),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/tenants/${id}/`);
      toast('Tenant removed successfully', 'success');
      setTenants(tenants.filter(t => t.id !== id));
    } catch {
      toast('Failed to remove tenant', 'error');
    }
  };

  const handleResendInvite = async (tenantId: number) => {
    setSendingInvite(tenantId);
    try {
      await api.post(`/tenants/${tenantId}/resend-invite/`);
      toast('Invitation resent successfully', 'success');
    } catch {
      toast('Failed to resend invitation', 'error');
    } finally {
      setSendingInvite(null);
    }
  };

  const canResend = (status: TenancyStatus) => status === 'invited' || status === 'profile_pending';

  return (
    <ErrorBoundary>
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Tenants</h1>
          <p className="mt-1" style={{ color: 'var(--text-light)' }}>{tenants.length} tenant{tenants.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Tenant
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>{editing ? 'Edit Tenant' : 'Add New Tenant'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Unit *</label>
                <select name="unit_id" value={form.unit_id} onChange={handleChange} required>
                  <option value="">Select unit...</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.property?.name || u.property_name} - {u.unit_number}</option>)}
                </select>
                {formErrors.unit_id && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{formErrors.unit_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
                {formErrors.name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{formErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+234..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Address</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="Home address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Annual Rent (₦)</label>
                  <input name="annual_rent" type="number" value={form.annual_rent} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Active</label>
                  <select name="is_active" value={form.is_active} onChange={handleChange}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Lease Start</label>
                  <input name="lease_start_date" type="date" value={form.lease_start_date} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Lease Expiry</label>
                  <input name="lease_expiry_date" type="date" value={form.lease_expiry_date} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Lease Renewal</label>
                  <input name="lease_renewal_date" type="date" value={form.lease_renewal_date} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Move-in Date</label>
                  <input name="move_in_date" type="date" value={form.move_in_date} onChange={handleChange} />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); setFormErrors({}); setForm(defaultForm); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create Tenant'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
      ) : tenants.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>No tenants yet</h3>
          <p className="mb-4" style={{ color: 'var(--text-light)' }}>Add tenants to your units</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">Add Tenant</button>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Name</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Unit</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Property</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Annual Rent</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Lease Expiry</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Status</th>
                <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => {
                const statusCfg = tenancyStatusConfig[t.tenancy_status] || tenancyStatusConfig.active;
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 px-4">
                      <Link href={`/tenants/${t.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                        {t.name}
                      </Link>
                      <div className="text-xs" style={{ color: 'var(--text-light)' }}>{t.email}</div>
                    </td>
                    <td className="py-3 px-4" style={{ color: 'var(--text-light)' }}>{t.unit?.unit_number || t.unit_number || '—'}</td>
                    <td className="py-3 px-4" style={{ color: 'var(--text-light)' }}>{t.unit?.property_name || t.property_name || '—'}</td>
                    <td className="py-3 px-4" style={{ color: 'var(--text)' }}>{t.annual_rent ? `₦${Number(t.annual_rent).toLocaleString()}/yr` : '—'}</td>
                    <td className="py-3 px-4" style={{ color: 'var(--text-light)' }}>{t.lease_expiry_date || '—'}</td>
                    <td className="py-3 px-4"><span className={`badge ${statusCfg.className}`}>{statusCfg.label}</span></td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button onClick={() => handleEdit(t)} className="text-primary-600 hover:text-primary-700 text-sm font-medium mr-3">Edit</button>
                      {canResend(t.tenancy_status) && (
                        <button
                          onClick={() => handleResendInvite(t.id)}
                          disabled={sendingInvite === t.id}
                          className="text-sm font-medium mr-3 disabled:opacity-50"
                          style={{ color: 'var(--success)' }}
                        >
                          {sendingInvite === t.id ? 'Sending...' : 'Resend Invite'}
                        </button>
                      )}
                      <button onClick={() => setDeleteTarget(t.id)} className="text-sm font-medium" style={{ color: 'var(--danger)' }}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Tenant"
        message="Are you sure you want to remove this tenant? The associated unit will become available."
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
