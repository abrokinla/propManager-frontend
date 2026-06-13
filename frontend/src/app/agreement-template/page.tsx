'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import ErrorBoundary from '../../components/ErrorBoundary';
import RichTextEditor from '../../components/RichTextEditor';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { Property, TenancyAgreementTemplate } from '../../types';

const EMPTY_TEMPLATE = {
  landlord_name: '',
  landlord_address: '',
  landlord_phone: '',
  security_deposit: "One month's rent",
  payment_due_date: 'On or before the 28th day of each month',
  late_fee: '₦10,000',
  duration: '1 year',
  obligations_landlord: '',
  obligations_tenant: '',
  notice_period: '3 months',
  early_termination_fee: '₦50,000',
  termination_conditions: '',
  additional_clauses: '',
};

export default function AgreementTemplatePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [templates, setTemplates] = useState<TenancyAgreementTemplate[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [title, setTitle] = useState('Tenancy Agreement');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [data, setData] = useState<Record<string, string>>({ ...EMPTY_TEMPLATE });

  useEffect(() => {
    Promise.all([
      api.get('/properties/'),
      api.get('/agreement-templates/'),
    ]).then(([pRes, tRes]) => {
      setProperties(pRes.data.results || pRes.data);
      setTemplates(tRes.data.results || tRes.data);
    }).catch(() => toast('Failed to load data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedPropertyId) return;
    const existing = templates.find(t => t.property === selectedPropertyId);
    if (existing) {
      setTemplateId(existing.id);
      setTitle(existing.title);
      setLogoUrl(existing.logo_url || '');
      setData({ ...EMPTY_TEMPLATE, ...existing.template_data });
    } else {
      setTemplateId(null);
      setTitle('Tenancy Agreement');
      setLogoUrl('');
      setData({ ...EMPTY_TEMPLATE });
    }
  }, [selectedPropertyId, templates]);

  const handleSave = async () => {
    if (!selectedPropertyId) { toast('Select a property first', 'error'); return; }
    setSaving(true);
    try {
      let logo_url = logoUrl;
      if (logoFile) {
        const formData = new FormData();
        formData.append('image', logoFile);
        const { data: uploadRes } = await api.post('/upload-image/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        logo_url = uploadRes.image_url;
      }

      const payload = {
        property_id: selectedPropertyId,
        title,
        logo_url,
        template_data: data,
      };

      if (templateId) {
        await api.put(`/agreement-templates/${templateId}/`, payload);
        toast('Agreement template updated', 'success');
      } else {
        const res = await api.post('/agreement-templates/', payload);
        setTemplateId(res.data.id);
        toast('Agreement template created', 'success');
      }
      const { data: tRes } = await api.get('/agreement-templates/');
      setTemplates(tRes.results || tRes);
    } catch {
      toast('Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: string, value: string) => setData(prev => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const selectedProp = properties.find(p => p.id === selectedPropertyId);

  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Tenancy Agreement Template</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-light)' }}>
              Set up the tenancy agreement for each property. Tenants will see this agreement on their dashboard.
            </p>
          </div>
        </div>

        <div className="card mb-6">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Property *</label>
          <select
            value={selectedPropertyId}
            onChange={e => setSelectedPropertyId(Number(e.target.value) || '')}
            className="w-full"
          >
            <option value="">Select a property...</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {templates.find(t => t.property === p.id) ? '(has template)' : '(no template)'}
              </option>
            ))}
          </select>
        </div>

        {selectedPropertyId && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Header</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Agreement Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Logo</label>
                  {logoUrl && (
                    <div className="mb-2">
                      <img src={logoUrl} alt="Logo preview" className="h-16 object-contain border rounded" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setLogoFile(e.target.files?.[0] || null)}
                    className="text-sm"
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>
                    {logoUrl ? 'Upload a new file to replace, or leave blank to keep current.' : 'Upload your property/company logo (optional).'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Landlord Info</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Landlord / Property Owner Name</label>
                  <input value={data.landlord_name} onChange={e => setField('landlord_name', e.target.value)} className="w-full" placeholder={selectedProp?.owner?.first_name ? `${selectedProp.owner.first_name} ${selectedProp.owner.last_name}` : ''} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Landlord Address</label>
                  <textarea value={data.landlord_address} onChange={e => setField('landlord_address', e.target.value)} rows={2} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Landlord Phone</label>
                  <input value={data.landlord_phone} onChange={e => setField('landlord_phone', e.target.value)} className="w-full" />
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Financial Terms</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Security Deposit</label>
                  <input value={data.security_deposit} onChange={e => setField('security_deposit', e.target.value)} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Payment Due Date</label>
                  <input value={data.payment_due_date} onChange={e => setField('payment_due_date', e.target.value)} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Late Payment Fee</label>
                  <input value={data.late_fee} onChange={e => setField('late_fee', e.target.value)} className="w-full" />
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Term</h2>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Duration</label>
                <input value={data.duration} onChange={e => setField('duration', e.target.value)} className="w-full max-w-xs" />
              </div>
            </div>

            <div className="card">
              <RichTextEditor label="Landlord Obligations" value={data.obligations_landlord} onChange={v => setField('obligations_landlord', v)} minHeight={200} />
            </div>

            <div className="card">
              <RichTextEditor label="Tenant Obligations" value={data.obligations_tenant} onChange={v => setField('obligations_tenant', v)} minHeight={200} />
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Termination</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Notice Period</label>
                  <input value={data.notice_period} onChange={e => setField('notice_period', e.target.value)} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Early Termination Fee</label>
                  <input value={data.early_termination_fee} onChange={e => setField('early_termination_fee', e.target.value)} className="w-full" />
                </div>
              </div>
              <RichTextEditor label="Termination Conditions" value={data.termination_conditions} onChange={v => setField('termination_conditions', v)} minHeight={150} />
            </div>

            <div className="card">
              <RichTextEditor label="Additional Clauses" value={data.additional_clauses} onChange={v => setField('additional_clauses', v)} minHeight={200} />
            </div>

            <div className="flex justify-end gap-3 pb-8">
              <button onClick={handleSave} disabled={saving} className="btn btn-primary disabled:opacity-50">
                {saving ? 'Saving...' : templateId ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        )}

        {!selectedPropertyId && (
          <div className="card text-center py-12">
            <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>Select a Property</h3>
            <p style={{ color: 'var(--text-light)' }}>Choose a property above to set up its tenancy agreement template.</p>
          </div>
        )}
      </DashboardLayout>
    </ErrorBoundary>
  );
}
