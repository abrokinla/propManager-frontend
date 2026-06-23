'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NotificationBell from './NotificationBell';

interface TenantNavbarProps {
  tenantName: string;
  onLogout: () => void;
  onOpenPasswordModal?: () => void;
}

export default function TenantNavbar({ tenantName, onLogout, onOpenPasswordModal }: TenantNavbarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
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
            <button onClick={() => router.push('/tenant/dashboard')} className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>
              Dashboard
            </button>

            <NotificationBell basePath="/tenant" />

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                style={{ color: 'var(--text-light)' }}
              >
                <span>{tenantName}</span>
                <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-1 w-56 rounded-xl shadow-lg border py-1 z-50"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{tenantName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-light)' }}>Tenant</p>
                  </div>
                  {onOpenPasswordModal && (
                    <button
                      onClick={() => { setDropdownOpen(false); onOpenPasswordModal(); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                      style={{ color: 'var(--text)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Change Password
                    </button>
                  )}
                  <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                      onClick={onLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                      style={{ color: 'var(--danger)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
