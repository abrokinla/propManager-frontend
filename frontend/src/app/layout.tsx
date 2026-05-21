import type { Metadata } from 'next';
import './globals.css';
import ClientProvider from '../components/ClientProvider';

export const metadata: Metadata = {
  title: 'PropManager - Property Management Platform',
  description: 'Multi-user property management SaaS for landlords and managers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
