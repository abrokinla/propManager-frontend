'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import PhoneInputWithCountry from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

/* ── Custom country select (replaces native <select>) ── */

interface CountryOption {
  value?: string;
  label: string;
  divider?: boolean;
}

interface CustomCountrySelectProps {
  value?: string;
  onChange: (value?: string) => void;
  options: CountryOption[];
  iconComponent: React.ComponentType<{ country?: string; countryName?: string }>;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  name?: string;
  'aria-label'?: string;
  tabIndex?: number | string;
  onFocus?: () => void;
  onBlur?: () => void;
}

function CustomCountrySelect({
  value,
  onChange,
  options,
  iconComponent: Icon,
  disabled,
  readOnly,
  className,
  name,
  'aria-label': ariaLabel,
  tabIndex,
  onFocus,
  onBlur,
}: CustomCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);
  const selectedLabel = selected?.label || 'International';

  const filtered = options.filter(o => {
    if (!search) return true;
    if (o.divider) return false;
    return o.label.toLowerCase().includes(search.toLowerCase()) ||
           (o.value && o.value.toLowerCase().includes(search.toLowerCase()));
  });

  const close = useCallback(() => {
    setOpen(false);
    setSearch('');
    onBlur?.();
  }, [onBlur]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSelect = (val?: string) => {
    onChange(val);
    close();
  };

  return (
    <div className={`phone-country-select ${className || ''}`} ref={containerRef}>
      <button
        type="button"
        className="phone-country-select-trigger"
        onClick={() => {
          if (disabled || readOnly) return;
          setOpen(!open);
          onFocus?.();
        }}
        disabled={disabled}
        tabIndex={tabIndex as number}
        aria-label={ariaLabel}
        name={name}
      >
        {value ? (
          <Icon country={value} countryName={selectedLabel} />
        ) : (
          <span className="phone-country-globe">&#127760;</span>
        )}
        <span className="phone-country-select-label">{selectedLabel}</span>
        <svg className={`phone-country-select-arrow ${open ? 'open' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="phone-country-dropdown">
          <div className="phone-country-search-wrapper">
            <input
              ref={searchRef}
              type="text"
              className="phone-country-search"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') close();
              }}
            />
          </div>
          <div className="phone-country-list">
            {filtered.map((option, i) => {
              if (option.divider) {
                return <div key={`divider-${i}`} className="phone-country-divider" />;
              }
              return (
                <button
                  key={option.value || 'international'}
                  type="button"
                  className={`phone-country-option ${option.value === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.value ? (
                    <Icon country={option.value} countryName={option.label} />
                  ) : (
                    <span className="phone-country-globe">&#127760;</span>
                  )}
                  <span className="phone-country-option-label">{option.label}</span>
                  {option.value && (
                    <span className="phone-country-option-code">{option.value}</span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="phone-country-empty">No countries found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── PhoneInput wrapper ── */

interface PhoneInputProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  defaultCountry?: string;
  placeholder?: string;
  id?: string;
  className?: string;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder,
  id,
  className = '',
}: PhoneInputProps) {
  return (
    <PhoneInputWithCountry
      international
      value={value}
      onChange={onChange}
      placeholder={placeholder || 'Enter phone number'}
      id={id}
      className={`phone-input ${className}`}
      countrySelectComponent={CustomCountrySelect}
    />
  );
}
