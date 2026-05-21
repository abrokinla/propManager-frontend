'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import ErrorBoundary from '../../components/ErrorBoundary';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { Unit, Tenant, PaginatedResponse } from '../../types';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ unit_id: '', name: '', phone: '', email: '', address: '', monthly_rent: '', lease_start_date: '', lease_renewal_date: '', lease_expiry_date: '', move_in_date: '', is_active: 'true' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
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
      const payload = { ...form, unit_id: Number(form.unit_id), monthly_rent: form.monthly_rent || null, is_active: form.is_active === 'true' };
      if (editing) {
        await api.put(`/tenants/${editing.id}/`, payload);
        toast('Tenant updated successfully', 'success');
      } else {
        await api.post('/tenants/', payload);
        toast('Tenant created successfully', 'success');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ unit_id: '', name: '', phone: '', email: '', address: '', monthly_rent: '', lease_start_date: '', lease_renewal_date: '', lease_expiry_date: '', move_in_date: '', is_active: 'true' });
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
      monthly_rent: t.monthly_rent ? String(t.monthly_rent) : '',
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

  return (
    <ErrorBoundary>
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="text-gray-500 mt-1">{tenants.length} tenant{tenants.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Tenant
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Tenant' : 'Add New Tenant'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <select name="unit_id" value={form.unit_id} onChange={handleChange} required>
                  <option value="">Select unit...</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.property?.name || u.property_name} - {u.unit_number}</option>)}
                </select>
                {formErrors.unit_id && <p className="text-red-500 text-xs mt-1">{formErrors.unit_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+234..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="Home address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (₦)</label>
                  <input name="monthly_rent" type="number" value={form.monthly_rent} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
                  <select name="is_active" value={form.is_active} onChange={handleChange}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease Start</label>
                  <input name="lease_start_date" type="date" value={form.lease_start_date} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease Expiry</label>
                  <input name="lease_expiry_date" type="date" value={form.lease_expiry_date} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease Renewal</label>
                  <input name="lease_renewal_date" type="date" value={form.lease_renewal_date} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Move-in Date</label>
                  <input name="move_in_date" type="date" value={form.move_in_date} onChange={handleChange} />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); setFormErrors({}); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
      ) : tenants.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="font-semibold text-lg mb-2">No tenants yet</h3>
          <p className="text-gray-500 mb-4">Add tenants to your units</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">Add Tenant</button>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Unit</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Property</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Rent</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Lease Expiry</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.email}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{t.unit?.unit_number || t.unit_number || '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{t.unit?.property_name || t.property_name || '—'}</td>
                  <td className="py-3 px-4">{t.monthly_rent ? `₦${Number(t.monthly_rent).toLocaleString()}` : '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{t.lease_expiry_date || '—'}</td>
                  <td className="py-3 px-4"><span className={`badge ${t.is_active ? 'badge-success' : 'badge-danger'}`}>{t.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleEdit(t)} className="text-primary-600 hover:text-primary-700 text-sm font-medium mr-3">Edit</button>
                    <button onClick={() => setDeleteTarget(t.id)} className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
                  </td>
                </tr>
              ))}
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
