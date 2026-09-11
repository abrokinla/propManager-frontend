'use client';

import PhoneInputWithCountry from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

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
  defaultCountry = 'NG',
  placeholder,
  id,
  className = '',
}: PhoneInputProps) {
  return (
    <PhoneInputWithCountry
      international
      defaultCountry={defaultCountry as any}
      value={value}
      onChange={onChange}
      placeholder={placeholder || '+234 800 000 0000'}
      id={id}
      className={`phone-input ${className}`}
      countrySelectProps={{ 'aria-label': 'Country' } as any}
    />
  );
}
