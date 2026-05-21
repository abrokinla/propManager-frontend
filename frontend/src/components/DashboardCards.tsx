'use client';

import React from 'react';
import Link from 'next/link';
import type { DashboardStats } from '../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}

export function StatCard({ title, value, icon, color = 'blue' }: StatCardProps) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function QuickActions({ items }: { items: Array<{ label: string; href: string; color?: string }> }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-sm font-medium"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function RecentActivity({ payments }: { payments: DashboardStats['recent_payments'] }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-lg mb-4">Recent Payments</h3>
      {payments.length === 0 ? (
        <p className="text-gray-500 text-sm">No recent payments</p>
      ) : (
        <div className="space-y-3">
          {payments.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-medium text-sm">{p.tenant}</p>
                <p className="text-xs text-gray-500">{p.month_for}</p>
              </div>
              <span className="font-semibold text-green-600">₦{p.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LeaseAlerts({ expirations }: { expirations: DashboardStats['upcoming_lease_expirations'] }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-lg mb-4">Lease Expiring Soon</h3>
      {expirations.length === 0 ? (
        <p className="text-gray-500 text-sm">No upcoming lease expirations</p>
      ) : (
        <div className="space-y-3">
          {expirations.map((e, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-medium text-sm">{e.tenant}</p>
                <p className="text-xs text-gray-500">{e.property} · Unit {e.unit}</p>
              </div>
              <span className="badge badge-warning text-xs">{e.expiry_date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
