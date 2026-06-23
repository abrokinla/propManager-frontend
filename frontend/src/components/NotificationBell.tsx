'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import type { Notification } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('access_token') || localStorage.getItem('tenant_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function NotificationBell({ basePath }: { basePath: string }) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchUnread = async () => {
    try {
      const { data } = await axios.get<{ count: number }>(`${API_URL}/notifications/unread-count/`, { headers: getAuthHeaders() });
      setUnread(data.count);
    } catch { /* ignore */ }
  };

  const fetchRecent = async () => {
    try {
      const { data } = await axios.get<Notification[]>(`${API_URL}/notifications/`, { headers: getAuthHeaders() });
      setNotifications(data.slice(0, 5));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) fetchRecent();
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await axios.post(`${API_URL}/notifications/mark-all-read/`, {}, { headers: getAuthHeaders() });
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  const goTo = (link: string) => {
    setOpen(false);
    router.push(basePath + link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg transition-colors"
        style={{ color: 'var(--text-light)' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-80 rounded-xl shadow-lg border py-1 z-50"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">Mark all read</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-light)' }}>No notifications yet</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => goTo(n.link)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 border-b`}
                  style={{
                    borderColor: 'var(--border)',
                    background: n.is_read ? 'transparent' : 'rgba(37,99,235,0.04)',
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{n.title}</p>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-light)' }}>{n.message}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-light)' }}>
                    {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => { setOpen(false); router.push(basePath + '/notifications'); }}
            className="w-full text-center text-sm py-2 font-medium border-t transition-colors hover:bg-gray-50"
            style={{ color: 'var(--primary)', borderColor: 'var(--border)' }}
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
}
