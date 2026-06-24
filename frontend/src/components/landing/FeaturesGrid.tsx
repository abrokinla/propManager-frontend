'use client';

import { motion } from 'framer-motion';
import {
  Building2, Users, CreditCard, Wrench, FileText, Bell,
} from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const features = [
  {
    icon: Building2,
    title: 'Property Management',
    description: 'Track properties, units, and tenants from a single dashboard. Organize by location, status, and rent cycle.',
  },
  {
    icon: Users,
    title: 'Tenant Portal',
    description: 'Tenants get a self-service dashboard to view agreements, pay rent, request maintenance, and update their profile.',
  },
  {
    icon: CreditCard,
    title: 'Rent Tracking & Payments',
    description: 'Track rent cycles (daily, monthly, yearly). Tenants submit payment proof for approval. Lease dates auto-update.',
  },
  {
    icon: Wrench,
    title: 'Maintenance Requests',
    description: 'Tenants submit maintenance requests with priority levels. You get notified and can track resolution progress.',
  },
  {
    icon: FileText,
    title: 'Digital Agreements',
    description: 'Create customizable tenancy agreement templates. E-sign with witnesses or upload signed PDFs for verification.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Get notified on rent changes, quit notices, payment approvals, and document events. Email escalation for critical alerts.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-20 sm:py-28" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm tracking-wide uppercase mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: 'var(--text)' }}>
              Everything you need to manage properties
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-light)' }}>
              From listing to lease, PropManager gives you the tools to run your property business efficiently.
            </p>
          </div>
        </ScrollReveal>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                className="group relative p-6 sm:p-8 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 mb-4 group-hover:from-indigo-500/20 group-hover:to-violet-500/20 transition-colors">
                    <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-light)' }}>{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
