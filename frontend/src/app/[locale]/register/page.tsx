'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { useTranslations } from 'next-intl';

export default function RegisterPage() {
  const { register } = useAuth();
  const t = useTranslations('Register');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await register(form);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: Record<string, string[] | string> } };
      const data = axiosError.response?.data;
      if (data) {
        const fieldErrors: Record<string, string> = {};
        for (const [key, value] of Object.entries(data)) {
          fieldErrors[key] = Array.isArray(value) ? value[0] : value;
        }
        setErrors(fieldErrors);
      } else {
        setErrors({ general: t('registrationFailed') });
      }
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{t('createAccount')}</h1>
          <p className="mt-1" style={{ color: 'var(--text-light)' }}>{t('startManaging')}</p>
        </div>

        <div className="card">
          {errors.general && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('firstName')}</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} placeholder={t('firstNamePlaceholder')} />
                {errors.first_name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.first_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('lastName')}</label>
                <input name="last_name" value={form.last_name} onChange={handleChange} placeholder={t('lastNamePlaceholder')} />
                {errors.last_name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.last_name}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('username')}</label>
              <input name="username" value={form.username} onChange={handleChange} required placeholder={t('usernamePlaceholder')} />
              {errors.username && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('email')}</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder={t('emailPlaceholder')} />
              {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('password')}</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder={t('passwordPlaceholder')} minLength={8} />
              {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center py-3 disabled:opacity-50">
              {loading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              ) : t('createAccountBtn')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: 'var(--text-light)' }}>
            {t('hasAccount')}{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('signIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
