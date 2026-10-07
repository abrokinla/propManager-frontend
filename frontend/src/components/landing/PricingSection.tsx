'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2 } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import { useTranslations } from 'next-intl';
import { Link } from '../../navigation';
import { API_BASE_URL } from '../../lib/api';
import type { BillingInterval, CatalogPlan, PricingCatalog, Track } from '../../types';

const EASE = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

function formatUSD(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/**
 * Renders one limit as a short phrase.
 *
 * Feature copy is built from data rather than hardcoded per plan so a limit
 * change in plans.py cannot leave a stale "Up to 5 properties" string on the
 * card. The nouns are translated; the numbers never are.
 */
function limitRows(plan: CatalogPlan, t: ReturnType<typeof useTranslations>) {
  const rows: { key: string; value: string }[] = [];

  if (plan.key.startsWith('agent_')) {
    if (plan.limits.properties === null) {
      rows.push({ key: 'properties', value: t('unlimitedProperties') });
    } else {
      rows.push({
        key: 'properties',
        value: t('propertiesCount', { count: plan.limits.properties }),
      });
    }
  } else {
    const units = plan.limits.units ?? null;
    if (units === null) {
      rows.push({ key: 'units', value: t('unlimitedUnits') });
    } else {
      rows.push({
        key: 'units',
        value: t('unitsCount', { count: units }),
      });
    }
  }

  rows.push({
    key: 'team',
    value:
      plan.limits.team_members === null
        ? t('unlimitedTeam')
        : t('teamCount', { count: plan.limits.team_members }),
  });

  if (plan.limits.analytics_days === null) {
    rows.push({ key: 'analytics', value: t('unlimitedAnalytics') });
  } else {
    rows.push({
      key: 'analytics',
      value:
        plan.limits.analytics_days >= 365
          ? t('fullHistory')
          : t('daysOfAnalytics', { count: plan.limits.analytics_days }),
    });
  }

  return rows;
}

/** Capability lines, translated per feature key. */
const FEATURE_ROWS: { key: string; feature: string }[] = [
  { key: 'leadExport', feature: 'lead_export' },
  { key: 'whiteLabel', feature: 'white_label' },
  { key: 'customDomain', feature: 'custom_domain' },
  { key: 'whatsappApi', feature: 'whatsapp_api' },
];

function PricingCard({
  plan,
  interval,
  track,
  popular,
  onCheckout,
}: {
  plan: CatalogPlan;
  interval: BillingInterval;
  track: Track;
  popular: boolean;
  onCheckout: (priceId: string) => void;
}) {
  const t = useTranslations('Pricing');

  const monthly = formatUSD(plan.display_monthly_cents);
  const annualTotal = formatUSD(plan.annual_cents);
  const isAnnual = interval === 'year';
  const rows = limitRows(plan, t);
  const features = plan.features as Record<string, boolean>;

  const handleClick = () => {
    if (plan.is_free) {
      // Free plans go straight to register
      window.location.href = `/register?track=${track}&plan=${plan.key}`;
    } else {
      // Paid plans open Paddle checkout
      const priceId = isAnnual ? plan.paddle_price_id_annual : plan.paddle_price_id_monthly;
      if (priceId) {
        onCheckout(priceId);
      }
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.4, ease: EASE }}
      data-testid={`plan-card-${plan.key}`}
      data-monthly-cents={plan.monthly_cents}
      data-annual-cents={plan.annual_cents}
      className={`relative rounded-2xl border p-6 sm:p-8 transition-all duration-300 hover:shadow-xl ${
        popular ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.02]' : ''
      }`}
      style={{
        backgroundColor: 'var(--card)',
        borderColor: popular ? '#6366f1' : 'var(--border)',
      }}
    >
      {popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md">
          {t('mostPopular')}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>
          {plan.label}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-light)' }}>
          {t(`plans.${plan.key}.blurb`)}
        </p>
      </div>

      <div className="mb-2">
        <span className="text-4xl font-extrabold" style={{ color: 'var(--text)' }}>
          {monthly}
        </span>
        <span className="text-sm ml-1" style={{ color: 'var(--text-light)' }}>
          {t('perMonth')}
        </span>
      </div>

      <p className="text-xs mb-6 min-h-[2rem]" style={{ color: 'var(--text-light)' }}>
        {isAnnual ? t('billedAnnually', { total: annualTotal }) : t('billedMonthly')}
      </p>

      <button
        type="button"
        onClick={handleClick}
        className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all mb-8 ${
          popular
            ? 'text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md hover:shadow-lg'
            : 'border hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
        style={{
          borderColor: 'var(--border)',
          color: popular ? 'white' : 'var(--text)',
        }}
      >
        {plan.is_free ? t('startFree') : t('getStarted')}
      </button>

      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.key} className="flex items-start gap-3 text-sm">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <span style={{ color: 'var(--text)' }}>{row.value}</span>
          </li>
        ))}
        {FEATURE_ROWS.map(({ key, feature }) => {
          if (!features[feature]) return null;
          const pending = plan.pending_features.includes(feature as never);
          return (
            <li key={key} className="flex items-start gap-3 text-sm">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span style={{ color: 'var(--text)' }}>
                {t(`features.${key}`)}
                {pending && (
                  <span
                    className="ml-2 align-middle text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: 'var(--border)', color: 'var(--text-light)' }}
                  >
                    {t('comingSoon')}
                  </span>
                )}
              </span>
            </li>
          );
        })}
        {FEATURE_ROWS.filter(({ feature }) => !features[feature]).map(({ key, feature }) => (
          <li key={`missing-${key}`} data-feature={feature} className="flex items-start gap-3 text-sm opacity-50">
            <X className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--text-light)' }} />
            <span style={{ color: 'var(--text-light)' }}>{t(`features.${key}`)}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function PricingSection() {
  const t = useTranslations('Pricing');
  const [track, setTrack] = useState<Track>('owner');
  const [interval, setInterval] = useState<BillingInterval>('month');
  const [catalog, setCatalog] = useState<PricingCatalog | null>(null);
  const [error, setError] = useState(false);
  const [paddleReady, setPaddleReady] = useState(false);

  // Load Paddle.js
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).Paddle) {
      setPaddleReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/paddle.js';
    script.async = true;
    script.onload = () => {
      (window as any).Paddle.Environment.set('sandbox');
      (window as any).Paddle.Initialize({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
      });
      setPaddleReady(true);
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const openCheckout = useCallback((priceId: string) => {
    if (typeof window === 'undefined' || !(window as any).Paddle) return;
    const frontendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://propmanager.abrokinla.workers.dev';
    (window as any).Paddle.Checkout.open({
      items: [{ price_id: priceId }],
      successUrl: `${frontendUrl}/register?paddle_checkout=completed`,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    // No fallback copy: a hardcoded price list is exactly what drifted out of
    // sync with the backend before. Better to show an error than to quote a
    // number we cannot verify.
    fetch(`${API_BASE_URL}/pricing/`)
      .then((res) => {
        if (!res.ok) throw new Error(`pricing ${res.status}`);
        return res.json();
      })
      .then((data: PricingCatalog) => {
        if (!cancelled) setCatalog(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const trackCatalog = catalog?.tracks[track];
  const plans = trackCatalog?.plans ?? [];
  const popularKey = trackCatalog?.popular_plan;

  return (
    <section id="pricing" className="py-20 sm:py-28" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm tracking-wide uppercase mb-3">
              {t('badge')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: 'var(--text)' }}>
              {t('title')}
            </h2>
            <p className="text-lg max-w-xl mx-auto mb-8" style={{ color: 'var(--text-light)' }}>
              {t('subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div
                className="inline-flex items-center p-1 rounded-xl border"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
              >
                {(['agent', 'owner'] as Track[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => setTrack(value)}
                    data-testid={`track-tab-${value}`}
                    aria-pressed={track === value}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                      track === value ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    style={{ color: track === value ? 'white' : 'var(--text)' }}
                  >
                    {t(`tracks.${value}`)}
                  </button>
                ))}
              </div>

              <div
                className="inline-flex items-center p-1 rounded-xl border"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
              >
                {(['month', 'year'] as BillingInterval[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => setInterval(value)}
                    data-testid={`interval-${value}`}
                    aria-pressed={interval === value}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      interval === value ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    style={{ color: interval === value ? 'white' : 'var(--text)' }}
                  >
                    {value === 'month' ? t('monthly') : t('annual')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {error && (
          <p
            className="text-center py-12"
            style={{ color: 'var(--text-light)' }}
            role="status"
          >
            {t('loadError')}
          </p>
        )}

        {!catalog && !error && (
          <div className="flex justify-center py-16" style={{ color: 'var(--text-light)' }}>
            <Loader2 className="w-6 h-6 animate-spin" aria-hidden />
          </div>
        )}

        <AnimatePresence mode="wait">
          {catalog && (
            <motion.div
              key={`${track}-${interval}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start max-w-5xl mx-auto"
            >
              {plans.map((plan) => (
                <PricingCard
                  key={plan.key}
                  plan={plan}
                  interval={interval}
                  track={track}
                  popular={plan.key === popularKey}
                  onCheckout={openCheckout}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {catalog && (
          <>
            <p className="text-center text-sm mt-10" style={{ color: 'var(--text-light)' }}>
              {t('trial')}
            </p>
            {!catalog.checkout_available && (
              <p className="text-center text-xs mt-3" style={{ color: 'var(--text-light)' }}>
                {t('checkoutSoon')}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}