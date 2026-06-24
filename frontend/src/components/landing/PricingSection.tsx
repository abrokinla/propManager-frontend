'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

type Region = 'ng' | 'intl';

const nairaPricing = {
  free: {
    name: 'Free',
    desc: 'Get started with basic property management.',
    price: '₦0',
    period: '/year',
    features: [
      '1 property',
      'Tenant management',
      'Basic property listing',
      'Email notifications',
    ],
    missing: [],
  },
  growth: {
    name: 'Growth',
    desc: 'For growing agencies managing multiple properties.',
    price: '₦60,000',
    period: '/year',
    popular: true,
    features: [
      'Everything in Free, plus:',
      '1–3 properties',
      'Rent tracking & payments',
      'Maintenance requests',
      'Digital tenancy agreements',
      'E-signing with witnesses',
      'All notifications',
    ],
    missing: ['White-label branding', 'Priority support'],
    buckets: [
      { label: '1–3 properties', price: '₦60,000' },
      { label: '4–10 properties', price: '₦150,000' },
      { label: '11–25 properties', price: '₦300,000' },
    ],
  },
  premium: {
    name: 'Premium',
    desc: 'For established firms who want their brand front and center.',
    price: '₦120,000',
    period: '/year',
    features: [
      'Everything in Growth, plus:',
      'White-label branding',
      'Your logo on tenant portal',
      'Your logo on PDF agreements',
      'Your brand on email notifications',
      'Priority support',
      'API access',
    ],
    missing: [],
    buckets: [
      { label: '1–3 properties', price: '₦120,000' },
      { label: '4–10 properties', price: '₦250,000' },
      { label: '11–25 properties', price: '₦450,000' },
    ],
  },
};

const intlPricing = {
  free: {
    name: 'Free',
    desc: 'Get started with basic property management.',
    price: '$0',
    period: '/mo',
    features: [
      '1 property',
      'Tenant management',
      'Basic property listing',
      'Email notifications',
    ],
    missing: [],
  },
  pro: {
    name: 'Pro',
    desc: 'For professional property managers.',
    price: '$19',
    period: '/mo',
    popular: true,
    features: [
      'Everything in Free, plus:',
      'Up to 5 properties',
      'Rent tracking & payments',
      'Maintenance requests',
      'Digital tenancy agreements',
      'E-signing with witnesses',
      'All notifications',
    ],
    missing: ['White-label branding', 'Priority support'],
  },
  enterprise: {
    name: 'Enterprise',
    desc: 'For agencies and firms at scale.',
    price: '$49',
    period: '/mo',
    features: [
      'Everything in Pro, plus:',
      'Unlimited properties',
      'White-label branding',
      'Priority support',
      'API access',
    ],
    missing: [],
  },
};

function PricingCard({ plan, region }: { plan: any; region: Region }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
      className={`relative rounded-2xl border p-6 sm:p-8 transition-all duration-300 hover:shadow-xl ${
        plan.popular
          ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.02]'
          : ''
      }`}
      style={{
        backgroundColor: plan.popular ? 'var(--card-bg)' : 'var(--card-bg)',
        borderColor: plan.popular ? '#6366f1' : 'var(--border)',
      }}
    >
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md">
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>{plan.name}</h3>
        <p className="text-sm" style={{ color: 'var(--text-light)' }}>{plan.desc}</p>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-extrabold" style={{ color: 'var(--text)' }}>{plan.price}</span>
        <span className="text-sm ml-1" style={{ color: 'var(--text-light)' }}>{plan.period}</span>
      </div>

      <a
        href="/register"
        className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all mb-8 ${
          plan.popular
            ? 'text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md hover:shadow-lg'
            : 'border hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
        style={{
          borderColor: 'var(--border)',
          color: plan.popular ? 'white' : 'var(--text)',
        }}
      >
        Get Started
      </a>

      {/* Buckets (Nigeria Growth / Premium only) */}
      {plan.buckets && (
        <div className="mb-6 p-4 rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'rgba(99,102,241,0.03)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-light)' }}>Volume Pricing</p>
          <div className="space-y-2">
            {plan.buckets.map((b: any) => (
              <div key={b.label} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-light)' }}>{b.label}</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>{b.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {plan.features.map((f: string) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <span style={{ color: 'var(--text)' }}>{f}</span>
          </li>
        ))}
        {plan.missing?.map((f: string) => (
          <li key={f} className="flex items-start gap-3 text-sm opacity-50">
            <X className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--text-light)' }} />
            <span style={{ color: 'var(--text-light)' }}>{f}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function PricingSection() {
  const [region, setRegion] = useState<Region>('ng');

  const plans = region === 'ng'
    ? [nairaPricing.free, nairaPricing.growth, nairaPricing.premium]
    : [intlPricing.free, intlPricing.pro, intlPricing.enterprise];

  return (
    <section id="pricing" className="py-20 sm:py-28" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm tracking-wide uppercase mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: 'var(--text)' }}>
              Simple, transparent pricing
            </h2>
            <p className="text-lg max-w-xl mx-auto mb-8" style={{ color: 'var(--text-light)' }}>
              Pay based on where you operate. Nigerian pricing is annual; international is monthly.
            </p>

            <div className="inline-flex items-center p-1 rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
              <button
                onClick={() => setRegion('ng')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  region === 'ng'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                style={{ color: region === 'ng' ? 'white' : 'var(--text)' }}
              >
                Nigeria ₦
              </button>
              <button
                onClick={() => setRegion('intl')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  region === 'intl'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                style={{ color: region === 'intl' ? 'white' : 'var(--text)' }}
              >
                International $
              </button>
            </div>
          </div>
        </ScrollReveal>

        <AnimatePresence mode="wait">
          <motion.div
            key={region}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start max-w-5xl mx-auto"
          >
            {plans.map((plan) => (
              <PricingCard key={plan.name} plan={plan} region={region} />
            ))}
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-sm mt-10" style={{ color: 'var(--text-light)' }}>
          All plans include a 14-day free trial. No credit card required for Free tier.
        </p>
      </div>
    </section>
  );
}
