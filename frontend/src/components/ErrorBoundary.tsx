'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

function ErrorFallback() {
  const t = useTranslations('ErrorBoundary');
  return (
    <div className="flex items-center justify-center h-64">
      <div className="card text-center p-8">
        <h2 className="text-lg font-semibold text-red-600 mb-2">{t('somethingWentWrong')}</h2>
        <p className="text-gray-500 text-sm mb-4">{t('unexpectedError')}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          {t('reloadPage')}
        </button>
      </div>
    </div>
  );
}

class ErrorBoundaryClass extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback />;
    }
    return this.props.children;
  }
}

export default function ErrorBoundary({ children, fallback }: Props) {
  return <ErrorBoundaryClass fallback={fallback}>{children}</ErrorBoundaryClass>;
}
