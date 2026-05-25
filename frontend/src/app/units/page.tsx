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
        property_id: unit.property?.id || unit.property_id,
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
  const propName = (unit: Unit) => unit.property?.name || unit.property_name || '—';

  return (
    <ErrorBoundary>
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Units</h1>
          <p className="text-gray-500 mt-1">{units.length} unit{units.length === 1 ? '' : 's'} · Units are auto-created from property total_units</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
      ) : units.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="font-semibold text-lg mb-2">No units yet</h3>
          <p className="text-gray-500 mb-4">Units are created automatically when you set total_units on a property.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Unit</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Property</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Beds</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Baths</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Toilets</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Sqft</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Rent</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Sale</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Tenant</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => {
                const isEditing = editingId === unit.id;
                const vals = editValues[unit.id];
                const isSaving = savingId === unit.id;
                return (
                  <tr key={unit.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{unit.unit_number}</td>
                    <td className="py-3 px-4 text-gray-600">{propName(unit)}</td>

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
                        <td className="py-3 px-4 text-center text-gray-600">{unit.bedrooms}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{unit.bathrooms}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{unit.toilets}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{unit.size_sqft ?? '—'}</td>
                        <td className="py-3 px-4 text-right">{unit.price_rent ? `₦${Number(unit.price_rent).toLocaleString()}` : '—'}</td>
                        <td className="py-3 px-4 text-right">{unit.price_sale ? `₦${Number(unit.price_sale).toLocaleString()}` : '—'}</td>
                      </>
                    )}

                    <td className="py-3 px-4"><span className={`badge ${statusColor(unit.status)}`}>{unit.status}</span></td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{unit.tenant_name || '—'}</td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {isEditing ? (
                        <span className="flex gap-1 justify-end">
                          <button onClick={() => saveUnit(unit)} disabled={isSaving} className="text-green-600 hover:text-green-700 text-sm font-medium disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                          <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700 text-sm font-medium ml-2">Cancel</button>
                        </span>
                      ) : (
                        <span className="flex gap-1 justify-end">
                          <button onClick={() => startEdit(unit)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">Edit</button>
                          <button onClick={() => setDeleteTarget(unit.id)} className="text-red-600 hover:text-red-700 text-sm font-medium ml-2">Delete</button>
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
