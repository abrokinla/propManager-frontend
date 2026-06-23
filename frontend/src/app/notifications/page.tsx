'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import DashboardLayout from '../../components/DashboardLayout';
import type { Notification } from '../../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get<Notification[]>(`${API_URL}/notifications/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        });
        setNotifications(data);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const markRead = async (id: number) => {
    try {
      await axios.post(`${API_URL}/notifications/${id}/mark-read/`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await axios.post(`${API_URL}/notifications/mark-all-read/`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Notifications</h1>
          {notifications.some(n => !n.is_read) && (
            <button onClick={markAllRead} className="btn btn-secondary text-sm">Mark All Read</button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="card text-center py-12">
            <p style={{ color: 'var(--text-light)' }}>No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => { if (!n.is_read) markRead(n.id); if (n.link) router.push(n.link); }}
                className="w-full text-left card p-4 transition-colors hover:bg-gray-50"
                style={{
                  borderLeft: n.is_read ? '3px solid transparent' : '3px solid var(--primary)',
                  opacity: n.is_read ? 0.75 : 1,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{n.title}</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>{n.message}</p>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-light)' }}>
                      {new Date(n.created_at).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {n.type && (
                    <span className="badge badge-info text-[10px] shrink-0 capitalize">{n.type.replace(/_/g, ' ')}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
