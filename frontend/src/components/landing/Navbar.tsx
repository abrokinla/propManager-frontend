'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 dark:border-gray-700/50'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
            <span className="font-bold text-xl" style={{ color: 'var(--text)' }}>
              PropManager
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                style={{ color: 'var(--text-light)' }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="/login"
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{ color: 'var(--text)' }}
            >
              Login
            </a>
            <a
              href="/register"
              className="px-5 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md hover:shadow-lg"
            >
              Get Started
            </a>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" style={{ color: 'var(--text)' }} /> : <Menu className="w-5 h-5" style={{ color: 'var(--text)' }} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-slate-900"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block text-sm font-medium py-2"
                  style={{ color: 'var(--text-light)' }}
                >
                  {link.label}
                </a>
              ))}
              <hr className="border-gray-200 dark:border-gray-700" />
              <a
                href="/login"
                onClick={() => setOpen(false)}
                className="block text-sm font-medium py-2"
                style={{ color: 'var(--text)' }}
              >
                Login
              </a>
              <a
                href="/register"
                onClick={() => setOpen(false)}
                className="block text-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-violet-600"
              >
                Get Started
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
