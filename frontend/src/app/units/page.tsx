'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import ErrorBoundary from '../../components/ErrorBoundary';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { Property, Unit, PaginatedResponse } from '../../types';

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [form, setForm] = useState({ property_id: '', unit_number: '', bedrooms: '1', toilets: '1', bathrooms: '1', size_sqft: '', price_sale: '', price_rent: '', status: 'Available' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      api.get<PaginatedResponse<Unit>>('/units/'),
      api.get<PaginatedResponse<Property>>('/properties/'),
    ]).then(([unitsRes, propsRes]) => {
      setUnits(unitsRes.data.results);
      setProperties(propsRes.data.results);
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
      const payload = { ...form, property_id: Number(form.property_id), bedrooms: Number(form.bedrooms), toilets: Number(form.toilets), bathrooms: Number(form.bathrooms), size_sqft: form.size_sqft ? Number(form.size_sqft) : null, price_sale: form.price_sale || null, price_rent: form.price_rent || null };
      if (editing) {
        await api.put(`/units/${editing.id}/`, payload);
        toast('Unit updated successfully', 'success');
      } else {
        await api.post('/units/', payload);
        toast('Unit created successfully', 'success');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ property_id: '', unit_number: '', bedrooms: '1', toilets: '1', bathrooms: '1', size_sqft: '', price_sale: '', price_rent: '', status: 'Available' });
      const { data } = await api.get<PaginatedResponse<Unit>>('/units/');
      setUnits(data.results);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: Record<string, string[] | string> } };
      const data = axiosError.response?.data;
      if (data) {
        const fe: Record<string, string> = {};
        for (const [k, v] of Object.entries(data)) fe[k] = Array.isArray(v) ? v[0] : v;
        setFormErrors(fe);
      } else {
        toast('Failed to save unit', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditing(unit);
    setForm({
      property_id: String(unit.property?.id || unit.property_id || ''),
      unit_number: unit.unit_number,
      bedrooms: String(unit.bedrooms),
      toilets: String(unit.toilets),
      bathrooms: String(unit.bathrooms),
      size_sqft: unit.size_sqft ? String(unit.size_sqft) : '',
      price_sale: unit.price_sale ? String(unit.price_sale) : '',
      price_rent: unit.price_rent ? String(unit.price_rent) : '',
      status: unit.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/units/${id}/`);
      toast('Unit deleted successfully', 'success');
      setUnits(units.filter(u => u.id !== id));
    } catch {
      toast('Failed to delete unit', 'error');
    }
  };

  const statusColor = (s: string) => s === 'Available' ? 'badge-success' : s === 'Occupied' ? 'badge-info' : 'badge-warning';

  return (
    <ErrorBoundary>
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Units</h1>
          <p className="text-gray-500 mt-1">{units.length} unit{units.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Unit
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Unit' : 'Add New Unit'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                <select name="property_id" value={form.property_id} onChange={handleChange} required>
                  <option value="">Select property...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {formErrors.property_id && <p className="text-red-500 text-xs mt-1">{formErrors.property_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
                <input name="unit_number" value={form.unit_number} onChange={handleChange} required placeholder="e.g. A101" />
                {formErrors.unit_number && <p className="text-red-500 text-xs mt-1">{formErrors.unit_number}</p>}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                  <input name="bedrooms" type="number" min="0" value={form.bedrooms} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                  <input name="bathrooms" type="number" min="0" value={form.bathrooms} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toilets</label>
                  <input name="toilets" type="number" min="0" value={form.toilets} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size (sqft)</label>
                  <input name="size_sqft" type="number" value={form.size_sqft} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Unavailable">Unavailable</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price (₦)</label>
                  <input name="price_sale" type="number" value={form.price_sale} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rent Price (₦)</label>
                  <input name="price_rent" type="number" value={form.price_rent} onChange={handleChange} />
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
      ) : units.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="font-semibold text-lg mb-2">No units yet</h3>
          <p className="text-gray-500 mb-4">Add units to your properties</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">Add Unit</button>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Unit</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Property</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Beds/Baths</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Rent</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Tenant</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{unit.unit_number}</td>
                  <td className="py-3 px-4 text-gray-600">{unit.property?.name || unit.property_name || '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{unit.bedrooms}bd/{unit.bathrooms}ba</td>
                  <td className="py-3 px-4">{unit.price_rent ? `₦${Number(unit.price_rent).toLocaleString()}` : '—'}</td>
                  <td className="py-3 px-4"><span className={`badge ${statusColor(unit.status)}`}>{unit.status}</span></td>
                  <td className="py-3 px-4 text-gray-600">{unit.tenant_name || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleEdit(unit)} className="text-primary-600 hover:text-primary-700 text-sm font-medium mr-3">Edit</button>
                    <button onClick={() => setDeleteTarget(unit.id)} className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Unit"
        message="Are you sure you want to delete this unit? This action cannot be undone."
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
