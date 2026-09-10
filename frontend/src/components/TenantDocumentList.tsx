'use client';

import { useTranslations } from 'next-intl';
import type { TenancyDocument, TenancyStatus } from '../types';

interface TenantDocumentListProps {
  documents: TenancyDocument[];
  onSendDocument: () => void;
  onUploadSigned: (doc: TenancyDocument) => void;
  tenantStatus: TenancyStatus;
}

export default function TenantDocumentList({
  documents, onSendDocument, onUploadSigned, tenantStatus,
}: TenantDocumentListProps) {
  const t = useTranslations('DocumentList');
  const canSend = tenantStatus === 'pending_document' || tenantStatus === 'document_sent';

  const statusLabels: Record<string, { label: string; className: string }> = {
    draft: { label: t('draft'), className: 'badge-warning' },
    sent: { label: t('sent'), className: 'badge-info' },
    viewed: { label: t('viewed'), className: 'badge-info' },
    signed: { label: t('signed'), className: 'badge-success' },
    completed: { label: t('completed'), className: 'badge-success' },
  };

  return (
    <div>
      {documents.length === 0 ? (
        <p className="text-gray-500 text-sm mb-4">{t('noDocuments')}</p>
      ) : (
        <div className="space-y-2 mb-4">
          {documents.map(doc => {
            const cfg = statusLabels[doc.status] || statusLabels.draft;
            return (
              <div key={doc.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-xs text-gray-400">
                    {doc.sent_at ? `Sent ${new Date(doc.sent_at).toLocaleDateString()}` : t('notSent')}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className={`badge ${cfg.className}`}>{cfg.label}</span>
                  {doc.status === 'sent' && (
                    <button
                      onClick={() => onUploadSigned(doc)}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {t('uploadSigned')}
                    </button>
                  )}
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {t('pdf')}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {canSend && (
        <button onClick={onSendDocument} className="btn btn-primary w-full text-sm">
          {t('sendAgreement')}
        </button>
      )}
    </div>
  );
}
