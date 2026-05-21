'use client';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
export default function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}
