'use client';

import { useState, useRef } from 'react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';
import type { TenancyDocument } from '../types';

interface UploadSignedDocumentModalProps {
  document: TenancyDocument;
  onClose: () => void;
  onUploaded: () => void;
}

export default function UploadSignedDocumentModal({ document, onClose, onUploaded }: UploadSignedDocumentModalProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast('Please select a signed document file', 'error');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('signed_file', file);
      await api.post(`/tenants/${document.tenant}/documents/${document.id}/upload-signed/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast('Signed document uploaded successfully', 'success');
      onUploaded();
      onClose();
    } catch {
      toast('Failed to upload signed document', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md">
        <h2 className="text-lg font-semibold mb-2">Upload Signed Document</h2>
        <p className="text-sm text-gray-500 mb-6">
          Upload the signed PDF received from the tenant after they have printed, signed, and scanned it.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400"
            onClick={() => fileRef.current?.click()}
          >
            {file ? (
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-xs text-red-600 hover:text-red-700 mt-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium text-gray-600">Click to upload signed PDF</p>
                <p className="text-xs text-gray-500 mt-1">PDF files only</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving || !file} className="btn btn-primary disabled:opacity-50">
              {saving ? 'Uploading...' : 'Upload Signed Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
