'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../../components/DashboardLayout';
import api from '../../../../lib/api';
import { useToast } from '../../../../context/ToastContext';
import type { AnalyticsSummary } from '../../../../types';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    api.get<AnalyticsSummary>(`/analytics/summary/?days=${days}`)
      .then(({ data }) => setData(data))
      .catch(() => toast('Failed to load analytics', 'error'))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="card text-center py-12">
          <p style={{ color: 'var(--text)' }}>No analytics data available.</p>
        </div>
      </DashboardLayout>
    );
  }

  const maxViews = Math.max(...data.views_over_time.map(d => d.views), 1);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Analytics</h1>
          <p className="mt-1" style={{ color: 'var(--text-light)' }}>Track how your listings are performing</p>
        </div>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="px-3 py-2 border rounded-lg text-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-light)' }}>Total Views</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{data.total_views.toLocaleString()}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>Last {data.period_days} days</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-light)' }}>Properties Viewed</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{data.properties.length}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>With at least 1 view</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-light)' }}>Traffic Sources</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{data.sources.length}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>Unique UTM sources</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Views Over Time */}
        <div className="card">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Views Over Time</h2>
          {data.views_over_time.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-light)' }}>No data for this period.</p>
          ) : (
            <div className="space-y-1">
              {data.views_over_time.map(d => (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="text-xs w-20 text-right" style={{ color: 'var(--text-light)' }}>
                    {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded"
                      style={{ width: `${(d.views / maxViews) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs w-8 text-right font-medium" style={{ color: 'var(--text)' }}>{d.views}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Source Breakdown */}
        <div className="card">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Traffic Sources</h2>
          {data.sources.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-light)' }}>No UTM sources tracked yet.</p>
          ) : (
            <div className="space-y-3">
              {data.sources.map(s => {
                const pct = data.total_views > 0 ? (s.count / data.total_views * 100) : 0;
                return (
                  <div key={s.utm_source}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium" style={{ color: 'var(--text)' }}>{s.utm_source}</span>
                      <span style={{ color: 'var(--text-light)' }}>{s.count} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                      <div className="h-full bg-green-500 rounded" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Properties */}
        <div className="card">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Top Properties</h2>
          {data.properties.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-light)' }}>No views yet.</p>
          ) : (
            <div className="space-y-3">
              {data.properties.map(p => (
                <div key={p.property__id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{p.property__name}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{p.total_views.toLocaleString()} views</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Referrers */}
        <div className="card">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Top Referrers</h2>
          {data.referrers.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-light)' }}>No referrer data yet.</p>
          ) : (
            <div className="space-y-2">
              {data.referrers.map(r => {
                let display = r.referrer;
                try { display = new URL(r.referrer).hostname; } catch {}
                return (
                  <div key={r.referrer} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-sm truncate max-w-[200px]" style={{ color: 'var(--text)' }} title={r.referrer}>{display}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>{r.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
