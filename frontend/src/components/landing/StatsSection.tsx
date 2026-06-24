'use client';

import { useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { Building2, Users, FileSignature } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const spring = useSpring(rounded, { stiffness: 80, damping: 20 });

  useEffect(() => {
    if (isInView) {
      animate(count, target, { duration: 2.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] });
    }
  }, [isInView, target, count]);

  return (
    <span ref={ref}>
      <motion.span>{spring}</motion.span>
      {suffix}
    </span>
  );
}

const stats = [
  { icon: Building2, target: 500, suffix: '+', label: 'Properties Managed' },
  { icon: Users, target: 1200, suffix: '+', label: 'Tenants Onboarded' },
  { icon: FileSignature, target: 3000, suffix: '+', label: 'Agreements Signed' },
];

export default function StatsSection() {
  return (
    <section className="py-16 border-y border-gray-200 dark:border-gray-800" style={{ backgroundColor: 'var(--card-bg)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 mb-4">
                    <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-extrabold mb-1" style={{ color: 'var(--text)' }}>
                    <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-light)' }}>{stat.label}</p>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
