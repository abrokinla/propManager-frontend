'use client';

import type { TenancyDocument, TenancyStatus } from '../types';

interface TenantDocumentListProps {
  documents: TenancyDocument[];
  onSendDocument: () => void;
  onUploadSigned: (doc: TenancyDocument) => void;
  tenantStatus: TenancyStatus;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'badge-warning' },
  sent: { label: 'Sent', className: 'badge-info' },
  viewed: { label: 'Viewed', className: 'badge-info' },
  signed: { label: 'Signed', className: 'badge-success' },
  completed: { label: 'Completed', className: 'badge-success' },
};

export default function TenantDocumentList({
  documents, onSendDocument, onUploadSigned, tenantStatus,
}: TenantDocumentListProps) {
  const canSend = tenantStatus === 'pending_document' || tenantStatus === 'document_sent';

  return (
    <div>
      {documents.length === 0 ? (
        <p className="text-gray-500 text-sm mb-4">No documents yet.</p>
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
                    {doc.sent_at ? `Sent ${new Date(doc.sent_at).toLocaleDateString()}` : 'Not sent'}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className={`badge ${cfg.className}`}>{cfg.label}</span>
                  {doc.status === 'sent' && (
                    <button
                      onClick={() => onUploadSigned(doc)}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Upload Signed
                    </button>
                  )}
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      PDF
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
          Send Tenancy Agreement
        </button>
      )}
    </div>
  );
}
