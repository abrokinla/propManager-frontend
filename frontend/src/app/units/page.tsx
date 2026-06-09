'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import ErrorBoundary from '../../components/ErrorBoundary';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { Property, Unit, PaginatedResponse } from '../../types';

interface EditState {
  [unitId: number]: {
    bedrooms: string;
    bathrooms: string;
    toilets: string;
    size_sqft: string;
    price_rent: string;
    price_sale: string;
  };
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<EditState>({});
  const [savingId, setSavingId] = useState<number | null>(null);
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

  const startEdit = (unit: Unit) => {
    setEditingId(unit.id);
    setEditValues({
      [unit.id]: {
        bedrooms: String(unit.bedrooms),
        bathrooms: String(unit.bathrooms),
        toilets: String(unit.toilets),
        size_sqft: unit.size_sqft ? String(unit.size_sqft) : '',
        price_rent: unit.price_rent ? String(unit.price_rent) : '',
        price_sale: unit.price_sale ? String(unit.price_sale) : '',
      },
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleEditChange = (unitId: number, field: string, value: string) => {
    setEditValues(prev => ({
      ...prev,
      [unitId]: { ...prev[unitId], [field]: value },
    }));
  };

  const saveUnit = async (unit: Unit) => {
    const vals = editValues[unit.id];
    if (!vals) return;
    setSavingId(unit.id);
    try {
      const payload = {
        property_id: unit.property_id || unit.property?.id,
        unit_number: unit.unit_number,
        bedrooms: Number(vals.bedrooms),
        bathrooms: Number(vals.bathrooms),
        toilets: Number(vals.toilets),
        size_sqft: vals.size_sqft ? Number(vals.size_sqft) : null,
        price_rent: vals.price_rent || null,
        price_sale: vals.price_sale || null,
        status: unit.status,
      };
      const { data } = await api.put<Unit>(`/units/${unit.id}/`, payload);
      setUnits(prev => prev.map(u => u.id === unit.id ? data : u));
      toast('Unit updated', 'success');
      cancelEdit();
    } catch {
      toast('Failed to update unit', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/units/${id}/`);
      setUnits(prev => prev.filter(u => u.id !== id));
      toast('Unit deleted', 'success');
    } catch {
      toast('Failed to delete unit', 'error');
    }
  };

  const statusColor = (s: string) => s === 'Available' ? 'badge-success' : s === 'Occupied' ? 'badge-info' : 'badge-warning';

  const filteredUnits = selectedProperty
    ? units.filter(u => u.property_id === selectedProperty.id)
    : [];

  return (
    <ErrorBoundary>
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {selectedProperty ? selectedProperty.name : 'Properties'}
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-light)' }}>
            {selectedProperty
              ? `${filteredUnits.length} unit${filteredUnits.length === 1 ? '' : 's'}`
              : `${properties.length} propert${properties.length === 1 ? 'y' : 'ies'} in your portfolio`
            }
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
      ) : selectedProperty ? (
        <>
          <button onClick={() => setSelectedProperty(null)} className="btn btn-secondary mb-4">← Back to Properties</button>

          {filteredUnits.length === 0 ? (
            <div className="card text-center py-12">
              <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>No units for this property</h3>
              <p className="mb-4" style={{ color: 'var(--text-light)' }}>Units are created when you set total_units on a property.</p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Unit</th>
                    <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Beds</th>
                    <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Baths</th>
                    <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Toilets</th>
                    <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Sqft</th>
                    <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Rent</th>
                    <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Sale</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Status</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Tenant</th>
                    <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.map((unit) => {
                    const isEditing = editingId === unit.id;
                    const vals = editValues[unit.id];
                    const isSaving = savingId === unit.id;
                    return (
                      <tr key={unit.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-3 px-4 font-medium" style={{ color: 'var(--text)' }}>{unit.unit_number}</td>

                        {isEditing && vals ? (
                          <>
                            <td className="py-2 px-2 text-center">
                              <input type="number" min="0" value={vals.bedrooms} onChange={e => handleEditChange(unit.id, 'bedrooms', e.target.value)} className="w-14 text-center px-1 py-1 border border-gray-300 rounded text-sm" />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <input type="number" min="0" value={vals.bathrooms} onChange={e => handleEditChange(unit.id, 'bathrooms', e.target.value)} className="w-14 text-center px-1 py-1 border border-gray-300 rounded text-sm" />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <input type="number" min="0" value={vals.toilets} onChange={e => handleEditChange(unit.id, 'toilets', e.target.value)} className="w-14 text-center px-1 py-1 border border-gray-300 rounded text-sm" />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <input type="number" min="0" value={vals.size_sqft} onChange={e => handleEditChange(unit.id, 'size_sqft', e.target.value)} className="w-16 text-center px-1 py-1 border border-gray-300 rounded text-sm" placeholder="—" />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input type="number" min="0" value={vals.price_rent} onChange={e => handleEditChange(unit.id, 'price_rent', e.target.value)} className="w-20 text-right px-1 py-1 border border-gray-300 rounded text-sm" placeholder="—" />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input type="number" min="0" value={vals.price_sale} onChange={e => handleEditChange(unit.id, 'price_sale', e.target.value)} className="w-20 text-right px-1 py-1 border border-gray-300 rounded text-sm" placeholder="—" />
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-4 text-center" style={{ color: 'var(--text-light)' }}>{unit.bedrooms}</td>
                            <td className="py-3 px-4 text-center" style={{ color: 'var(--text-light)' }}>{unit.bathrooms}</td>
                            <td className="py-3 px-4 text-center" style={{ color: 'var(--text-light)' }}>{unit.toilets}</td>
                            <td className="py-3 px-4 text-center" style={{ color: 'var(--text-light)' }}>{unit.size_sqft ?? '—'}</td>
                            <td className="py-3 px-4 text-right">{unit.price_rent ? `₦${Number(unit.price_rent).toLocaleString()}` : '—'}</td>
                            <td className="py-3 px-4 text-right">{unit.price_sale ? `₦${Number(unit.price_sale).toLocaleString()}` : '—'}</td>
                          </>
                        )}

                        <td className="py-3 px-4"><span className={`badge ${statusColor(unit.status)}`}>{unit.status}</span></td>
                        <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-light)' }}>{unit.tenant_name || '—'}</td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {isEditing ? (
                            <span className="flex gap-1 justify-end">
                              <button onClick={() => saveUnit(unit)} disabled={isSaving} className="text-sm font-medium disabled:opacity-50" style={{ color: 'var(--success)' }}>
                                {isSaving ? 'Saving...' : 'Save'}
                              </button>
                              <button onClick={cancelEdit} className="text-sm font-medium ml-2" style={{ color: 'var(--text-light)' }}>Cancel</button>
                            </span>
                          ) : (
                            <span className="flex gap-1 justify-end">
                              <button onClick={() => startEdit(unit)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">Edit</button>
                              <button onClick={() => setDeleteTarget(unit.id)} className="text-sm font-medium ml-2" style={{ color: 'var(--danger)' }}>Delete</button>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : properties.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--hover-bg)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--text-light)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>No properties yet</h3>
          <p className="mb-4" style={{ color: 'var(--text-light)' }}>Add a property first to see its units.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => (
            <div
              key={prop.id}
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedProperty(prop)}
            >
              {prop.image_url ? (
                <div className="h-32 -mx-6 -mt-6 mb-4 overflow-hidden">
                  <img src={prop.image_url} alt={prop.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-32 -mx-6 -mt-6 mb-4 flex items-center justify-center" style={{ background: 'var(--hover-bg)' }}>
                  <svg className="w-10 h-10" style={{ color: 'var(--text-light)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
              )}
              <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--text)' }}>{prop.name}</h3>
              <p className="text-sm mb-3" style={{ color: 'var(--text-light)' }}>{prop.address}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-light)' }}>
                  {prop.total_units ?? prop.units_count ?? 0} unit{(prop.total_units ?? prop.units_count ?? 0) === 1 ? '' : 's'}
                </span>
                <span className="text-sm font-medium text-primary-600">Edit Units →</span>
              </div>
            </div>
          ))}
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