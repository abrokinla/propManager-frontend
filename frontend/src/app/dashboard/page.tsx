'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { StatCard, QuickActions, RecentActivity, LeaseAlerts } from '../../components/DashboardCards';
import api from '../../lib/api';
import type { DashboardStats } from '../../types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats/')
      .then(({ data }) => setStats(data))
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !stats) {
    return (
      <DashboardLayout>
        <div className="card text-center" style={{ color: 'var(--danger)' }}>{error || 'Failed to load'}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Dashboard</h1>
        <p className="mt-1" style={{ color: 'var(--text-light)' }}>Overview of your property portfolio</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Properties"
          value={stats.total_properties}
          color="blue"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          title="Total Units"
          value={stats.total_units}
          color="purple"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
        />
        <StatCard
          title="Occupancy Rate"
          value={`${stats.occupancy_rate}%`}
          color="green"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <StatCard
          title="Total Revenue"
          value={`₦${stats.total_revenue.toLocaleString()}`}
          color="yellow"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title="Open Maintenance"
          value={stats.open_maintenance}
          color="red"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          title="Occupied Units"
          value={`${stats.occupied_units}/${stats.total_units}`}
          color="green"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <QuickActions
          items={[
            { label: '+ Add Property', href: '/properties' },
            { label: '+ Add Unit', href: '/units' },
            { label: '+ Add Tenant', href: '/tenants' },
            { label: '+ Record Payment', href: '/payments' },
            { label: '+ Maintenance Request', href: '/maintenance' },
          ]}
        />
      </div>

      {stats?.public_slug && (
        <div className="mb-8">
          <div
            onClick={() => setShowShareModal(true)}
            className="card cursor-pointer hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>Share Your Listings</p>
              <p className="text-sm" style={{ color: 'var(--text-light)' }}>Get a unique link to share your properties with potential clients.</p>
            </div>
            <svg className="w-5 h-5 ml-auto shrink-0" style={{ color: 'var(--text-light)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowShareModal(false); setCopied(false); }}>
          <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Share Your Listings</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
              Share this link with potential clients to show them your available properties.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/listings/agent/${stats?.public_slug}`}
                className="flex-1 text-sm px-3 py-2 border rounded"
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}/listings/agent/${stats?.public_slug}`
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    /* fallback */
                  }
                }}
                className="btn btn-primary text-sm shrink-0"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              onClick={() => { setShowShareModal(false); setCopied(false); }}
              className="btn btn-secondary w-full mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Activity + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity payments={stats.recent_payments} />
        <LeaseAlerts expirations={stats.upcoming_lease_expirations} />
      </div>
    </DashboardLayout>
  );
}
