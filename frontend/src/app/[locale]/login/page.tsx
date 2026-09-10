'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const { login } = useAuth();
  const t = useTranslations('Login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">PM</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{t('welcomeBack')}</h1>
          <p className="mt-1" style={{ color: 'var(--text-light)' }}>{t('signInSubtitle')}</p>
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('username')}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder={t('usernamePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t('passwordPlaceholder')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center py-3 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              ) : t('signIn')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: 'var(--text-light)' }}>
            {t('noAccount')}{' '}
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('createOne')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
