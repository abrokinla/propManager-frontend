'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../../components/DashboardLayout';
import api from '../../../../lib/api';
import { useToast } from '../../../../context/ToastContext';
import type { VisitBooking } from '../../../../types';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<VisitBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    api.get<VisitBooking[]>('/bookings/')
      .then(({ data }) => setBookings(data))
      .catch(() => toast('Failed to load bookings', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: number, action: 'confirm' | 'cancel') => {
    try {
      const { data } = await api.post<VisitBooking>(`/bookings/${id}/${action}/`);
      setBookings(bookings.map(b => b.id === data.id ? data : b));
      toast(`Booking ${action === 'confirm' ? 'confirmed' : 'cancelled'}`, 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Action failed', 'error');
    }
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Visit Bookings</h1>
        <p className="mt-1" style={{ color: 'var(--text-light)' }}>Manage guest visit requests</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-primary-600 text-white'
                : 'border text-sm'
            }`}
            style={filter !== s ? { borderColor: 'var(--border)', color: 'var(--text)' } : {}}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-light)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="font-medium mb-2" style={{ color: 'var(--text)' }}>No bookings found</p>
          <p className="text-sm" style={{ color: 'var(--text-light)' }}>
            {filter === 'all' ? 'No visit bookings have been made yet.' : `No ${filter} bookings.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(booking => (
            <div key={booking.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{booking.guest_name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[booking.status]}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-light)' }}>
                    <strong>Property:</strong> {booking.property_name}
                  </p>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-light)' }}>
                    <strong>Date:</strong> {booking.visit_date} at {booking.visit_time}
                  </p>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-light)' }}>
                    <strong>Email:</strong> {booking.guest_email}
                  </p>
                  {booking.guest_phone && (
                    <p className="text-sm mb-1" style={{ color: 'var(--text-light)' }}>
                      <strong>Phone:</strong> {booking.guest_phone}
                    </p>
                  )}
                  {booking.notes && (
                    <p className="text-sm mt-2 p-2 rounded" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                      {booking.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {booking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction(booking.id, 'confirm')}
                        className="btn btn-primary text-sm"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleAction(booking.id, 'cancel')}
                        className="btn btn-secondary text-sm"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleAction(booking.id, 'cancel')}
                      className="btn btn-secondary text-sm"
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    >
                      Cancel
                    </button>
                  )}
                  {booking.whatsapp_enabled && booking.whatsapp_link && (
                    <a
                      href={booking.whatsapp_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn text-sm text-center"
                      style={{ background: '#25D366', color: 'white' }}
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
