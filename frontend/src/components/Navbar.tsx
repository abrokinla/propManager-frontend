'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import { useTranslations } from 'next-intl';

interface NavItem {
  href: string;
  label: string;
}

interface NavGroup {
  label: string;
  href?: string;
  items?: NavItem[];
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const t = useTranslations('AppNavbar');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const navGroups: NavGroup[] = [
    { label: t('dashboard'), href: '/dashboard' },
    {
      label: t('properties'),
      items: [
        { href: '/properties', label: t('properties') },
        { href: '/units', label: t('units') },
        { href: '/tenants', label: t('tenants') },
      ],
    },
    {
      label: t('finance'),
      items: [
        { href: '/payments', label: t('payments') },
      ],
    },
    {
      label: t('operations'),
      items: [
        { href: '/maintenance', label: t('maintenance') },
        { href: '/agreement-template', label: t('agreementTemplate') },
      ],
    },
    {
      label: t('scheduling'),
      items: [
        { href: '/dashboard/availability', label: t('availability') },
        { href: '/dashboard/bookings', label: t('bookings') },
      ],
    },
    { label: t('analytics'), href: '/dashboard/analytics' },
  ];

  const isActive = (href: string) => pathname === href;
  const isGroupActive = (group: NavGroup) =>
    group.href ? isActive(group.href) : group.items?.some(i => isActive(i.href)) ?? false;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ background: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>PropManager</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5" ref={navRef}>
            {navGroups.map((group) => {
              const active = isGroupActive(group);
              const hasDropdown = !!group.items;

              if (!hasDropdown) {
                return (
                  <Link
                    key={group.href}
                    href={group.href!}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-primary-50' : 'hover:bg-gray-100'
                    }`}
                    style={{
                      color: active ? 'var(--primary)' : 'var(--text-light)',
                      background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
                    }}
                  >
                    {group.label}
                  </Link>
                );
              }

              const isOpen = openGroup === group.label;

              return (
                <div key={group.label} className="relative">
                  <button
                    onClick={() => setOpenGroup(isOpen ? null : group.label)}
                    onMouseEnter={() => setOpenGroup(group.label)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-primary-50' : 'hover:bg-gray-100'
                    }`}
                    style={{
                      color: active ? 'var(--primary)' : 'var(--text-light)',
                      background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
                    }}
                  >
                    {group.label}
                    <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div
                      className="absolute left-0 mt-1 w-48 rounded-xl shadow-lg border py-1 z-50"
                      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                      onMouseLeave={() => setOpenGroup(null)}
                    >
                      {group.items!.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => { setOpenGroup(null); }}
                          className={`block px-4 py-2 text-sm transition-colors ${
                            isActive(item.href) ? 'font-medium' : 'hover:bg-gray-50'
                          }`}
                          style={{
                            color: isActive(item.href) ? 'var(--primary)' : 'var(--text)',
                            background: isActive(item.href) ? 'rgba(37,99,235,0.08)' : 'transparent',
                          }}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            <NotificationBell basePath="" />

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-light)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              aria-label={theme === 'dark' ? t('switchToLight') : t('switchToDark')}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                style={{ color: 'var(--text-light)' }}
              >
                <span>{user?.first_name || user?.username}</span>
                <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-1 w-56 rounded-xl shadow-lg border py-1 z-50"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user?.first_name || user?.username}</p>
                    <p className="text-xs" style={{ color: 'var(--text-light)' }}>{user?.profile.role === 'owner' ? t('propertyOwner') : t('propertyManager')}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                    style={{ color: 'var(--text)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {t('profile')}
                  </Link>
                  <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                      style={{ color: 'var(--danger)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: 'var(--text)' }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t pt-2" style={{ borderColor: 'var(--border)' }}>
            {navGroups.map((group) => {
              const active = isGroupActive(group);
              const hasDropdown = !!group.items;

              if (!hasDropdown) {
                return (
                  <Link
                    key={group.href}
                    href={group.href!}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                      active ? 'bg-primary-50' : ''
                    }`}
                    style={{
                      color: active ? 'var(--primary)' : 'var(--text-light)',
                      background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
                    }}
                  >
                    {group.label}
                  </Link>
                );
              }

              const expanded = mobileExpanded === group.label;

              return (
                <div key={group.label}>
                  <button
                    onClick={() => setMobileExpanded(expanded ? null : group.label)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium"
                    style={{ color: active ? 'var(--primary)' : 'var(--text-light)' }}
                  >
                    {group.label}
                    <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expanded && (
                    <div className="pl-4">
                      {group.items!.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`block px-3 py-2 rounded-lg text-sm ${
                            isActive(item.href) ? 'font-medium' : ''
                          }`}
                          style={{
                            color: isActive(item.href) ? 'var(--primary)' : 'var(--text-light)',
                            background: isActive(item.href) ? 'rgba(37,99,235,0.08)' : 'transparent',
                          }}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="mt-2 pt-2 flex items-center justify-between px-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>{user?.first_name || user?.username}</span>
                <button onClick={toggleTheme} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-light)' }}>
                  {theme === 'dark' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  )}
                </button>
              </div>
              <button onClick={logout} className="btn btn-secondary text-sm">{t('logout')}</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
