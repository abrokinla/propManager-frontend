'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '../../../navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import ErrorBoundary from '../../../components/ErrorBoundary';
import ConfirmDialog from '../../../components/ConfirmDialog';
import AIGenerator from '../../../components/AIGenerator';
import api from '../../../lib/api';
import { uploadImage } from '../../../lib/upload';
import { useToast } from '../../../context/ToastContext';
import type { Property, PaginatedResponse } from '../../../types';

export default function PropertiesPage() {
  const t = useTranslations('Properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [form, setForm] = useState({ name: '', address: '', property_type: 'Apartment', description: '', total_units: '1', image_url: '', is_published: 'false', amenities: '', nearby_places: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchProperties = async () => {
    try {
      const { data } = await api.get<PaginatedResponse<Property>>('/properties/');
      setProperties(data.results);
    } catch {
      toast(t('failedToLoad'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) setFormErrors({ ...formErrors, [e.target.name]: '' });
  };

  const handleTogglePublished = () => {
    setForm(prev => ({ ...prev, is_published: prev.is_published === 'true' ? 'false' : 'true' }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await uploadImage(file);
    if (result.success && result.url) {
      setForm(prev => ({ ...prev, image_url: result.url! }));
      toast(t('imageUploaded'), 'success');
    } else {
      toast(result.error || t('imageUploadFailed'), 'error');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSaving(true);
    try {
      const payload = { ...form, total_units: parseInt(form.total_units, 10), is_published: form.is_published === 'true' };
      if (editing) {
        await api.put(`/properties/${editing.id}/`, payload);
      } else {
        await api.post('/properties/', payload);
      }
      toast(editing ? t('updatedSuccessfully') : t('createdSuccessfully'), 'success');
      setForm({ name: '', address: '', property_type: 'Apartment', description: '', total_units: '1', image_url: '', is_published: 'false', amenities: '', nearby_places: '' });
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
        toast(t('failedToSave'), 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (prop: Property) => {
    setEditing(prop);
    setForm({ name: prop.name, address: prop.address, property_type: prop.property_type, description: prop.description, total_units: String(prop.total_units ?? 1), image_url: prop.image_url || '', is_published: prop.is_published ? 'true' : 'false', amenities: prop.amenities || '', nearby_places: prop.nearby_places || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/properties/${id}/`);
      toast(t('deletedSuccessfully'), 'success');
      fetchProperties();
    } catch {
      toast(t('failedToDelete'), 'error');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', address: '', property_type: 'Apartment', description: '', total_units: '1', image_url: '', is_published: 'false', amenities: '', nearby_places: '' });
    setFormErrors({});
  };

  return (
    <ErrorBoundary>
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{t('title')}</h1>
          <p className="mt-1" style={{ color: 'var(--text-light)' }}>{t('count', { count: properties.length })}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {t('addProperty')}
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 modal-overlay">
          <div className="card w-full max-w-2xl mt-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{editing ? t('editProperty') : t('addNewProperty')}</h2>
              <button onClick={closeForm} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-light)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Basic Info */}
              <div className="form-section">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-light)' }}>{t('basicInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('propertyName')}</label>
                    <input name="name" value={form.name} onChange={handleChange} required placeholder={t('propertyNamePlaceholder')} />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('address')}</label>
                    <input name="address" value={form.address} onChange={handleChange} required placeholder={t('addressPlaceholder')} />
                    {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('propertyType')}</label>
                    <select name="property_type" value={form.property_type} onChange={handleChange}>
                      <option value="Apartment">{t('typeApartment')}</option>
                      <option value="House">{t('typeHouse')}</option>
                      <option value="Condo">{t('typeCondo')}</option>
                      <option value="Commercial">{t('typeCommercial')}</option>
                      <option value="Villa">{t('typeVilla')}</option>
                      <option value="Townhouse">{t('typeTownhouse')}</option>
                      <option value="Studio">{t('typeStudio')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('totalUnits')}</label>
                    <input name="total_units" type="number" min="1" value={form.total_units} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="form-section">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-light)' }}>{t('descriptionMedia')}</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('description')}</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder={t('descriptionPlaceholder')} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('propertyImage')}</label>
                  {uploading ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center" style={{ borderColor: 'var(--border)' }}>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                      <p className="text-sm" style={{ color: 'var(--text-light)' }}>{t('uploadingImage')}</p>
                    </div>
                  ) : form.image_url ? (
                    <div className="relative">
                      <img src={form.image_url} alt="Property" className="h-36 w-full object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <button type="button" onClick={() => fileRef.current?.click()} className="bg-white text-gray-700 px-3 py-1.5 rounded text-sm font-medium">{t('change')}</button>
                        <button type="button" onClick={() => setForm(prev => ({ ...prev, image_url: '' }))} className="bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium">{t('remove')}</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
                      style={{ borderColor: 'var(--border)' }}
                      onClick={() => fileRef.current?.click()}
                    >
                      <svg className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-light)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="font-medium" style={{ color: 'var(--text-light)' }}>{t('clickToUpload')}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>{t('imageFormats')}</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  {form.image_url && (
                    <input type="hidden" name="image_url" value={form.image_url} />
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="form-section">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-light)' }}>{t('propertyDetails')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('amenities')}</label>
                    <textarea name="amenities" value={form.amenities} onChange={handleChange} rows={3} placeholder={t('amenitiesPlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('nearbyPlaces')}</label>
                    <textarea name="nearby_places" value={form.nearby_places} onChange={handleChange} rows={3} placeholder={t('nearbyPlacesPlaceholder')} />
                  </div>
                </div>
              </div>

              {/* Publishing */}
              <div className="form-section">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-light)' }}>{t('publishing')}</h3>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={form.is_published === 'true'} onChange={handleTogglePublished} />
                    <div className="w-10 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{t('published')}</p>
                    <p className="text-xs" style={{ color: 'var(--text-light)' }}>{t('publishDescription')}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={closeForm} className="btn btn-secondary">{t('cancel')}</button>
                <button type="submit" disabled={saving || uploading} className="btn btn-primary disabled:opacity-50">
                  {saving ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  ) : editing ? t('updateProperty') : t('createProperty')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Generator - only shown when editing an existing property */}
      {editing && (
        <div className="mt-6">
          <AIGenerator
            propertyId={editing.id}
            propertyName={editing.name}
            onDescriptionGenerated={(desc) => setForm(prev => ({ ...prev, description: desc }))}
          />
        </div>
      )}

      {/* Properties List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : properties.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--hover-bg)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--text-light)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>{t('emptyTitle')}</h3>
          <p className="mb-4" style={{ color: 'var(--text-light)' }}>{t('emptyDescription')}</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">{t('addProperty')}</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => (
            <div key={prop.id} className="card hover:shadow-md transition-shadow overflow-hidden group">
              {prop.image_url ? (
                <div className="h-40 -mx-6 -mt-6 mb-4 overflow-hidden">
                  <img src={prop.image_url} alt={prop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="h-40 -mx-6 -mt-6 mb-4 flex items-center justify-center" style={{ background: 'var(--hover-bg)' }}>
                  <svg className="w-10 h-10" style={{ color: 'var(--text-light)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="badge badge-info mb-2">{prop.property_type}</span>
                  {prop.is_published && <span className="badge badge-success ml-1">{t('published')}</span>}
                  <Link href={`/properties/${prop.id}`} className="font-semibold text-lg hover:text-primary-600 transition-colors block mt-1" style={{ color: 'var(--text)' }}>{prop.name}</Link>
                </div>
              </div>
              <p className="text-sm mb-4 flex items-center gap-1" style={{ color: 'var(--text-light)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {prop.address}
              </p>
              <div className="flex items-center justify-between text-sm mb-4" style={{ color: 'var(--text-light)' }}>
                <span>{prop.units_count}/{prop.total_units ?? prop.units_count} {t('unitCount', { count: prop.total_units ?? prop.units_count })}</span>
                <span>{t('added', { date: new Date(prop.created_at).toLocaleDateString() })}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(prop)} className="btn btn-secondary text-sm flex-1">{t('edit')}</button>
                <button onClick={() => setDeleteTarget(prop)} className="btn btn-danger text-sm flex-1">{t('delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('deleteTitle')}
        message={t('deleteMessage', { name: deleteTarget?.name ?? '' })}
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
