'use client';

export default function Footer() {
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
              Property management platform for agents and landlords. Manage properties, tenants, and agreements — all in one place.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Product</h4>
            <ul className="space-y-3">
              {['Features', 'Pricing', 'Login', 'Register'].map((item) => (
                <li key={item}>
                  <a
                    href={item === 'Features' ? '#features' : item === 'Pricing' ? '#pricing' : `/${item.toLowerCase()}`}
                    className="text-sm transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                    style={{ color: 'var(--text-light)' }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Company</h4>
            <ul className="space-y-3">
              {['About', 'Blog', 'Contact'].map((item) => (
                <li key={item}>
                  <span className="text-sm cursor-not-allowed opacity-50" style={{ color: 'var(--text-light)' }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Legal</h4>
            <ul className="space-y-3">
              {['Privacy Policy', 'Terms of Service'].map((item) => (
                <li key={item}>
                  <span className="text-sm cursor-not-allowed opacity-50" style={{ color: 'var(--text-light)' }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm text-center" style={{ color: 'var(--text-light)' }}>
            &copy; {new Date().getFullYear()} PropManager. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
