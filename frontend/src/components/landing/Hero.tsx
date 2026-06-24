'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Building, Users, FileText } from 'lucide-react';

export default function Hero() {
  const [email, setEmail] = useState('');

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 hero-gradient -z-10" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-white"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Trusted by agents across Nigeria
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.1] tracking-tight text-white mb-6">
              Property{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-400">
                Management
              </span>
              , Simplified.
            </h1>

            <p className="text-lg sm:text-xl text-white/70 max-w-lg mb-8 leading-relaxed">
              From listing to lease — manage properties, track rent, handle maintenance,
              and sign tenancy agreements digitally. One platform for agents and landlords.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-5 py-3.5 rounded-xl text-sm bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <a
                href={email ? `/register?email=${encodeURIComponent(email)}` : '/register'}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all shadow-xl hover:shadow-indigo-500/25 whitespace-nowrap"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <p className="text-sm text-white/50">
              Free for 1 property. No credit card required.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex -space-x-1">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                      <div className="w-2 h-2 rounded-full bg-violet-400" />
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <Building className="w-4 h-4 text-indigo-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Lekki Phase 1 Duplex</p>
                        <p className="text-xs text-white/50">Unit A · ₦3.5M/yr</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-full">Active</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-violet-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Chidi Okonkwo</p>
                        <p className="text-xs text-white/50">Tenant · Rent due: Dec 1</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-amber-300 bg-amber-500/10 px-2 py-1 rounded-full">Pending</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-emerald-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Tenancy Agreement</p>
                        <p className="text-xs text-white/50">Signed · Awaiting verification</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-blue-300 bg-blue-500/10 px-2 py-1 rounded-full">View</span>
                  </div>

                  <div className="h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-0.5">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="w-6 h-3 rounded-sm bg-gradient-to-t from-indigo-500/40 to-indigo-400/20" style={{ height: `${6 + i * 4}px` }} />
                        ))}
                      </div>
                      <span className="text-xs text-white/50">Rent collection: ₦2.4M this month</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
