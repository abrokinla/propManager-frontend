'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import type { Notification } from '../../../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getTenantToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tenant_access_token');
}

export default function TenantNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = getTenantToken();
        if (!token) { router.push('/tenant/login'); return; }
        const { data } = await axios.get<Notification[]>(`${API_URL}/notifications/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(data);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [router]);

  const markRead = async (id: number) => {
    try {
      const token = getTenantToken();
      await axios.post(`${API_URL}/notifications/${id}/mark-read/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      const token = getTenantToken();
      await axios.post(`${API_URL}/notifications/mark-all-read/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  const handleLogout = () => {
    localStorage.removeItem('tenant_access_token');
    localStorage.removeItem('tenant_refresh_token');
    localStorage.removeItem('tenant_user');
    router.push('/tenant/login');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="sticky top-0 z-50 border-b" style={{ background: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>PropManager</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/tenant/dashboard')} className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>Dashboard</button>
              <button onClick={handleLogout} className="text-sm font-medium" style={{ color: 'var(--danger)' }}>Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
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
            <p className="text-gray-500">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => { if (!n.is_read) markRead(n.id); if (n.link) { const clean = n.link.startsWith('/tenant') ? n.link : '/tenant' + n.link; router.push(clean); } }}
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
      </main>
    </div>
  );
}
