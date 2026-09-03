'use client';

import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="border-t" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>PropManager</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-light)' }}>
              {t('tagline')}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>{t('product')}</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-sm transition-colors hover:text-indigo-600 dark:hover:text-indigo-400" style={{ color: 'var(--text-light)' }}>{t('features')}</a></li>
              <li><a href="#pricing" className="text-sm transition-colors hover:text-indigo-600 dark:hover:text-indigo-400" style={{ color: 'var(--text-light)' }}>{t('pricing')}</a></li>
              <li><a href="/login" className="text-sm transition-colors hover:text-indigo-600 dark:hover:text-indigo-400" style={{ color: 'var(--text-light)' }}>{t('login')}</a></li>
              <li><a href="/register" className="text-sm transition-colors hover:text-indigo-600 dark:hover:text-indigo-400" style={{ color: 'var(--text-light)' }}>{t('register')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>{t('company')}</h4>
            <ul className="space-y-3">
              <li><span className="text-sm cursor-not-allowed opacity-50" style={{ color: 'var(--text-light)' }}>{t('about')}</span></li>
              <li><span className="text-sm cursor-not-allowed opacity-50" style={{ color: 'var(--text-light)' }}>{t('blog')}</span></li>
              <li><span className="text-sm cursor-not-allowed opacity-50" style={{ color: 'var(--text-light)' }}>{t('contact')}</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>{t('legal')}</h4>
            <ul className="space-y-3">
              <li><span className="text-sm cursor-not-allowed opacity-50" style={{ color: 'var(--text-light)' }}>{t('privacy')}</span></li>
              <li><span className="text-sm cursor-not-allowed opacity-50" style={{ color: 'var(--text-light)' }}>{t('terms')}</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm text-center" style={{ color: 'var(--text-light)' }}>
            &copy; {new Date().getFullYear()} PropManager. {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
