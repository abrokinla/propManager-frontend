'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '../../../../../navigation';
import { useParams } from 'next/navigation';
import axios from 'axios';
import type { AvailableSlot } from '../../../../../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function BookVisitPage() {
  const t = useTranslations('ListingsBook');
  const { slug } = useParams<{ slug: string }>();
  const [propertyName, setPropertyName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    notes: '',
    whatsapp_enabled: false,
  });

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setError('');
    setSelectedSlot('');
    axios.get(`${API_URL}/public/properties/slug/${slug}/slots/?date=${selectedDate}`)
      .then(({ data }) => {
        setPropertyName(data.property);
        setSlots(data.slots);
      })
      .catch(() => {
        setError(t('slotsLoadError'));
        setSlots([]);
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError(t('selectTimeSlot'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await axios.post(`${API_URL}/public/properties/slug/${slug}/book/`, {
        ...form,
        visit_date: selectedDate,
        visit_time: selectedSlot + ':00',
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || t('bookingFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center py-12 px-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>{t('submitted')}</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-light)' }}>
            {t('submittedDescription')}
          </p>
          <Link href={`/listings/${slug}`} className="btn btn-primary">
            {t('backToProperty')}
          </Link>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <span className="font-bold text-lg">{t('brand')}</span>
            </div>
            <Link href={`/listings/${slug}`} className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              ← {t('backToProperty')}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>{t('pageTitle')}</h1>
        <p className="mb-8" style={{ color: 'var(--text-light)' }}>{t('pageSubtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div className="card">
            <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>{t('step1')}</h2>
            <input
              type="date"
              min={today}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-lg"
              style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
              required
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="card">
              <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>{t('step2')}</h2>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : slots.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--text-light)' }}>
                  {t('noSlots')}
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {slots.map(slot => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                        selectedSlot === slot.time
                          ? 'bg-primary-600 text-white border-primary-600 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                      style={selectedSlot !== slot.time ? { color: 'var(--text)' } : {}}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Guest Info */}
          {selectedSlot && (
            <div className="card">
              <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>{t('step3')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('fullName')}</label>
                  <input
                    type="text"
                    value={form.guest_name}
                    onChange={e => setForm({ ...form, guest_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('email')}</label>
                  <input
                    type="email"
                    value={form.guest_email}
                    onChange={e => setForm({ ...form, guest_email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('phoneOptional')}</label>
                  <input
                    type="tel"
                    value={form.guest_phone}
                    onChange={e => setForm({ ...form, guest_phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                    placeholder="+234..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('notesOptional')}</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                    rows={3}
                    placeholder={t('notesPlaceholder')}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.whatsapp_enabled}
                    onChange={e => setForm({ ...form, whatsapp_enabled: e.target.checked })}
                    className="h-4 w-4"
                    id="whatsapp"
                  />
                  <label htmlFor="whatsapp" className="text-sm" style={{ color: 'var(--text)' }}>
                    {t('whatsappPreference')}
                  </label>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: '#FEE2E2', color: '#991B1B' }}>
              {error}
            </div>
          )}

          {selectedSlot && (
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full py-3 text-lg"
            >
              {submitting ? t('submitting') : t('bookVisit')}
            </button>
          )}
        </form>
      </main>
    </div>
  );
}
