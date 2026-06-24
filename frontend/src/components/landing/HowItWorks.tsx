'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Home, UserCheck, LayoutDashboard } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const steps = [
  {
    icon: Home,
    title: 'List Your Property',
    description: 'Add your property details, set rent prices, configure units, and publish your listing — all in minutes.',
  },
  {
    icon: UserCheck,
    title: 'Invite Tenants',
    description: 'Send automated invitations. Tenants create their own profiles, submit payments, and sign agreements digitally.',
  },
  {
    icon: LayoutDashboard,
    title: 'Manage from One Dashboard',
    description: 'Track rent collection, approve maintenance requests, verify signed documents, and get real-time notifications.',
  },
];

export default function HowItWorks() {
  const svgRef = useRef<SVGSVGElement>(null);
  const isInView = useInView(svgRef, { once: true, margin: '-100px' });

  return (
    <section className="py-20 sm:py-28" style={{ backgroundColor: 'var(--card-bg)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm tracking-wide uppercase mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: 'var(--text)' }}>
              Get started in three simple steps
            </h2>
          </div>
        </ScrollReveal>

        <div className="relative">
          <svg
            ref={svgRef}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none hidden lg:block"
            style={{ maxWidth: '700px' }}
          >
            <motion.path
              d="M 80 50 Q 350 0 620 50"
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            />
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
              </linearGradient>
            </defs>
          </svg>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, delay: i * 0.2, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                  className="relative text-center lg:text-left"
                >
                  <div className="flex flex-col items-center lg:items-start">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                        <Icon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                        {i + 1}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>{step.title}</h3>
                    <p className="text-sm leading-relaxed max-w-sm" style={{ color: 'var(--text-light)' }}>{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
