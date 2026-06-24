'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

export default function CTASection() {
  const [email, setEmail] = useState('');

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
            Start Managing Properties Free
          </h2>
          <p className="text-lg text-indigo-200 mb-8 max-w-xl mx-auto">
            Join agents across Nigeria who are already managing their properties the smart way.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-5 py-3.5 rounded-xl text-sm bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <a
              href={email ? `/register?email=${encodeURIComponent(email)}` : '/register'}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-indigo-700 bg-white hover:bg-indigo-50 transition-all shadow-lg whitespace-nowrap"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <p className="text-sm text-indigo-300 mt-4">
            Free for 1 property. No credit card needed. Upgrade anytime.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
