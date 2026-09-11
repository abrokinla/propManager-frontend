'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '../../../../components/DashboardLayout';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import api from '../../../../lib/api';
import { useToast } from '../../../../context/ToastContext';
import type { PropertyAvailability, Property, PaginatedResponse } from '../../../../types';

export default function AvailabilityPage() {
  const t = useTranslations('DashboardAvailability');
  const DAY_NAMES = [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')];
  const [slots, setSlots] = useState<PropertyAvailability[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<PropertyAvailability | null>(null);
  const [form, setForm] = useState({
    property: '',
    day_of_week: 0,
    start_time: '09:00',
    end_time: '17:00',
    slot_duration_minutes: 30,
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      api.get<PaginatedResponse<PropertyAvailability>>('/availability/'),
      api.get<PaginatedResponse<Property>>('/properties/'),
    ]).then(([availRes, propRes]) => {
      setSlots(availRes.data.results);
      setProperties(propRes.data.results);
    }).catch(() => toast(t('failedToLoadData'), 'error'))
      .finally(() => setLoading(false));
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, property: Number(form.property) };
      if (editingSlot) {
        const { data } = await api.put<PropertyAvailability>(`/availability/${editingSlot.id}/`, payload);
        setSlots(slots.map(s => s.id === data.id ? data : s));
        toast(t('availabilityUpdated'), 'success');
      } else {
        const { data } = await api.post<PropertyAvailability>('/availability/', payload);
        setSlots([data, ...slots]);
        toast(t('availabilityAdded'), 'success');
      }
      setShowForm(false);
      setEditingSlot(null);
      setForm({ property: '', day_of_week: 0, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, is_active: true });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || t('failedToSave');
      toast(msg, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await api.delete(`/availability/${id}/`);
      setSlots(slots.filter(s => s.id !== id));
      toast(t('deleted'), 'success');
    } catch {
      toast(t('failedToDelete'), 'error');
    }
  };

  const startEdit = (slot: PropertyAvailability) => {
    setEditingSlot(slot);
    setForm({
      property: String(slot.property),
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      slot_duration_minutes: slot.slot_duration_minutes,
      is_active: slot.is_active,
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{t('title')}</h1>
          <p className="mt-1" style={{ color: 'var(--text-light)' }}>{t('subtitle')}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingSlot(null); }}
          className="btn btn-primary"
        >
          {t('addAvailability')}
        </button>
      </div>

      {showForm && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
            {editingSlot ? t('editAvailability') : t('addAvailabilityTitle')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('property')}</label>
                <select
                  value={form.property}
                  onChange={e => setForm({ ...form, property: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                  required
                >
                  <option value="">{t('selectProperty')}</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('dayOfWeek')}</label>
                <select
                  value={form.day_of_week}
                  onChange={e => setForm({ ...form, day_of_week: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                  required
                >
                  {DAY_NAMES.map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('startTime')}</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={e => setForm({ ...form, start_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('endTime')}</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={e => setForm({ ...form, end_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('slotDuration')}</label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={form.slot_duration_minutes}
                  onChange={e => setForm({ ...form, slot_duration_minutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                  required
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4"
                  id="is_active"
                />
                <label htmlFor="is_active" className="text-sm" style={{ color: 'var(--text)' }}>{t('active')}</label>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary">
                {editingSlot ? t('update') : t('add')}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingSlot(null); }}
                className="btn btn-secondary"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {slots.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-light)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium mb-2" style={{ color: 'var(--text)' }}>{t('noAvailabilitySet')}</p>
          <p className="text-sm" style={{ color: 'var(--text-light)' }}>{t('addAvailabilityDescription')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map(slot => {
            const prop = properties.find(p => p.id === slot.property);
            return (
              <div key={slot.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${slot.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text)' }}>
                      {prop?.name || `Property #${slot.property}`}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                      {slot.day_display} &middot; {slot.start_time} – {slot.end_time} &middot; {slot.slot_duration_minutes}min slots
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(slot)} className="text-sm px-3 py-1 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                    {t('edit')}
                  </button>
                  <button onClick={() => handleDelete(slot.id)} className="text-sm px-3 py-1 rounded border" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                    {t('delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
