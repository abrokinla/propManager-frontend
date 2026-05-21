'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import ErrorBoundary from '../../components/ErrorBoundary';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { Property, PaginatedResponse } from '../../types';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [form, setForm] = useState({ name: '', address: '', property_type: 'Apartment', description: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const { toast } = useToast();

  const fetchProperties = async () => {
    try {
      const { data } = await api.get<PaginatedResponse<Property>>('/properties/');
      setProperties(data.results);
    } catch {
      toast('Failed to load properties', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) setFormErrors({ ...formErrors, [e.target.name]: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/properties/${editing.id}/`, form);
        toast('Property updated successfully', 'success');
      } else {
        await api.post('/properties/', form);
        toast('Property created successfully', 'success');
      }
      setForm({ name: '', address: '', property_type: 'Apartment', description: '' });
      setShowForm(false);
      setEditing(null);
      fetchProperties();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: Record<string, string[] | string> } };
      const data = axiosError.response?.data;
      if (data) {
        const fieldErrors: Record<string, string> = {};
        for (const [key, value] of Object.entries(data)) {
          fieldErrors[key] = Array.isArray(value) ? value[0] : value;
        }
        setFormErrors(fieldErrors);
      } else {
        toast('Failed to save property', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (prop: Property) => {
    setEditing(prop);
    setForm({ name: prop.name, address: prop.address, property_type: prop.property_type, description: prop.description });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/properties/${id}/`);
      toast('Property deleted successfully', 'success');
      fetchProperties();
    } catch {
      toast('Failed to delete property', 'error');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', address: '', property_type: 'Apartment', description: '' });
    setFormErrors({});
  };

  return (
    <ErrorBoundary>
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Properties</h1>
          <p className="text-gray-500 mt-1">{properties.length} propert{properties.length === 1 ? 'y' : 'ies'} in your portfolio</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Property
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Property' : 'Add New Property'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Sunset Apartments" />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input name="address" value={form.address} onChange={handleChange} required placeholder="e.g. 123 Main St" />
                {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <select name="property_type" value={form.property_type} onChange={handleChange}>
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Condo">Condo</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Villa">Villa</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Studio">Studio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Optional description..." />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={closeForm} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Properties List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : properties.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h3 className="font-semibold text-lg mb-2">No properties yet</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first property</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">Add Property</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => (
            <div key={prop.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="badge badge-info mb-2">{prop.property_type}</span>
                  <h3 className="font-semibold text-lg">{prop.name}</h3>
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-4 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {prop.address}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{prop.units_count} unit{prop.units_count === 1 ? '' : 's'}</span>
                <span>Added {new Date(prop.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(prop)} className="btn btn-secondary text-sm flex-1">Edit</button>
                <button onClick={() => setDeleteTarget(prop)} className="btn btn-danger text-sm flex-1">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Property"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => {
          const id = deleteTarget!.id;
          setDeleteTarget(null);
          return handleDelete(id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
    </ErrorBoundary>
  );
}
