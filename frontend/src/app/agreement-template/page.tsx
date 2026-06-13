'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import ErrorBoundary from '../../components/ErrorBoundary';
import RichTextEditor from '../../components/RichTextEditor';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { Property, TenancyAgreementTemplate } from '../../types';

const EMPTY_TEMPLATE: Record<string, any> = {
  agent: { name: '', description: 'Estate Surveyors, Managers and Valuers', address: '', mobile: '', email: '' },
  landlord: { name: '', address: '', legal_note: 'Includes Successors in Title, Executors and Assigns' },
  tenants_legal_note: 'Includes Successors in Title, Executors and Assigns',
  property: { description: '', address: '', referred_to_as: 'The Demised Premises', ownership_note: 'Bona fide property of the landlord' },
  tenancy_terms: {
    type: 'Yearly Tenancy', currency: 'NGN', payment: 'Payable in advance',
    due_by: 'Not later than thirty (30) days after commencement of each rental year',
    duration_years: 1,
    caution_fee: { amount: '', currency: 'NGN', type: 'Refundable', deducted_for: '', refunded_if: '', top_up: '' },
  },
  tenants_covenants: '',
  landlords_covenants: '',
  special_provisions: {
    notice_to_quit_months: 3, termination_notice_months: 3, holding_over_days: 7,
    communication_methods: 'Personal service, Service at party\'s apartment, Registered post, Courier Service',
    renewal_request_months: 3, rent_review_notice_months: 2, rent_review_reply_weeks: 2,
    extra_clauses: '',
  },
  execution: { landlord_label: 'Signed by the within-named LANDLORD', tenant_label: 'Signed by the within-named TENANT' },
};

function setNested(obj: Record<string, any>, path: string, value: any) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

function getNested(obj: Record<string, any>, path: string): any {
  const keys = path.split('.');
  let cur = obj;
  for (const k of keys) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return '';
    cur = cur[k];
  }
  return cur ?? '';
}

function CollapsibleSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{title}</h2>
        <svg className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-light)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  );
}

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
  const [data, setData] = useState<Record<string, any>>(JSON.parse(JSON.stringify(EMPTY_TEMPLATE)));

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
      const merged = JSON.parse(JSON.stringify(EMPTY_TEMPLATE));
      deepMerge(merged, existing.template_data);
      setData(merged);
    } else {
      setTemplateId(null);
      setTitle('Tenancy Agreement');
      setLogoUrl('');
      setData(JSON.parse(JSON.stringify(EMPTY_TEMPLATE)));
    }
  }, [selectedPropertyId, templates]);

  function deepMerge(base: any, override: any) {
    for (const k of Object.keys(override)) {
      if (override[k] && typeof override[k] === 'object' && !Array.isArray(override[k]) && base[k]) {
        deepMerge(base[k], override[k]);
      } else if (override[k] !== undefined && override[k] !== null) {
        base[k] = override[k];
      }
    }
  }

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

  const setF = (path: string, value: any) => {
    const copy = JSON.parse(JSON.stringify(data));
    setNested(copy, path, value);
    setData(copy);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Tenancy Agreement Template</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-light)' }}>
              Set up the tenancy agreement for each property. All sections below match the legal document structure.
            </p>
          </div>
        </div>

        <div className="card mb-6">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Property *</label>
          <select value={selectedPropertyId} onChange={e => setSelectedPropertyId(Number(e.target.value) || '')} className="w-full">
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
                  {logoUrl && <div className="mb-2"><img src={logoUrl} alt="Logo preview" className="h-16 object-contain border rounded" /></div>}
                  <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="text-sm" />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>
                    {logoUrl ? 'Upload new file to replace.' : 'Upload your company logo (optional).'}
                  </p>
                </div>
              </div>
            </div>

            <CollapsibleSection title="1. Agent / Management Company">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Company Name</label>
                  <input value={data.agent?.name || ''} onChange={e => setF('agent.name', e.target.value)} className="w-full" placeholder="e.g. Falobi Solid Rock and Associates" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Description</label>
                  <input value={data.agent?.description || ''} onChange={e => setF('agent.description', e.target.value)} className="w-full" placeholder="Estate Surveyors, Managers and Valuers" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Address</label>
                  <textarea value={data.agent?.address || ''} onChange={e => setF('agent.address', e.target.value)} rows={2} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Mobile</label>
                  <input value={data.agent?.mobile || ''} onChange={e => setF('agent.mobile', e.target.value)} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Email</label>
                  <input value={data.agent?.email || ''} onChange={e => setF('agent.email', e.target.value)} className="w-full" />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="2. Landlord">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Landlord Name</label>
                  <input value={data.landlord?.name || ''} onChange={e => setF('landlord.name', e.target.value)} className="w-full" placeholder="e.g. Ropedam Enterprises" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Landlord Address</label>
                  <textarea value={data.landlord?.address || ''} onChange={e => setF('landlord.address', e.target.value)} rows={2} className="w-full" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Legal Note</label>
                  <input value={data.landlord?.legal_note || ''} onChange={e => setF('landlord.legal_note', e.target.value)} className="w-full" placeholder="Includes Successors in Title, Executors and Assigns" />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="3. Property Description">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Description</label>
                  <textarea value={data.property?.description || ''} onChange={e => setF('property.description', e.target.value)} rows={2} className="w-full" placeholder="e.g. Two (2) bedroom apartment with appurtenances..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Address</label>
                  <textarea value={data.property?.address || ''} onChange={e => setF('property.address', e.target.value)} rows={2} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Referred to As</label>
                  <input value={data.property?.referred_to_as || ''} onChange={e => setF('property.referred_to_as', e.target.value)} className="w-full" placeholder="The Demised Premises" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Ownership Note</label>
                  <input value={data.property?.ownership_note || ''} onChange={e => setF('property.ownership_note', e.target.value)} className="w-full" placeholder="Bona fide property of the landlord" />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="4. Tenancy Terms">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Type</label>
                  <input value={data.tenancy_terms?.type || ''} onChange={e => setF('tenancy_terms.type', e.target.value)} className="w-full" placeholder="Yearly Tenancy" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Currency</label>
                  <input value={data.tenancy_terms?.currency || ''} onChange={e => setF('tenancy_terms.currency', e.target.value)} className="w-full" placeholder="NGN" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Duration (years)</label>
                  <input type="number" min="1" value={data.tenancy_terms?.duration_years || 1} onChange={e => setF('tenancy_terms.duration_years', Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Payment Terms</label>
                  <input value={data.tenancy_terms?.payment || ''} onChange={e => setF('tenancy_terms.payment', e.target.value)} className="w-full" placeholder="Payable in advance" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Due By</label>
                  <input value={data.tenancy_terms?.due_by || ''} onChange={e => setF('tenancy_terms.due_by', e.target.value)} className="w-full" />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text)' }}>Caution Fee</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Amount</label>
                    <input value={data.tenancy_terms?.caution_fee?.amount || ''} onChange={e => setF('tenancy_terms.caution_fee.amount', e.target.value)} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Type</label>
                    <input value={data.tenancy_terms?.caution_fee?.type || ''} onChange={e => setF('tenancy_terms.caution_fee.type', e.target.value)} className="w-full" placeholder="Refundable" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Currency</label>
                    <input value={data.tenancy_terms?.caution_fee?.currency || ''} onChange={e => setF('tenancy_terms.caution_fee.currency', e.target.value)} className="w-full" placeholder="NGN" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Deducted For</label>
                    <textarea value={data.tenancy_terms?.caution_fee?.deducted_for || ''} onChange={e => setF('tenancy_terms.caution_fee.deducted_for', e.target.value)} rows={2} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Refunded If</label>
                    <textarea value={data.tenancy_terms?.caution_fee?.refunded_if || ''} onChange={e => setF('tenancy_terms.caution_fee.refunded_if', e.target.value)} rows={2} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Top Up</label>
                    <textarea value={data.tenancy_terms?.caution_fee?.top_up || ''} onChange={e => setF('tenancy_terms.caution_fee.top_up', e.target.value)} rows={2} className="w-full" />
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            <div className="card">
              <RichTextEditor label="5. Tenant's Covenants" value={data.tenants_covenants || ''} onChange={v => setF('tenants_covenants', v)} minHeight={250} />
            </div>

            <div className="card">
              <RichTextEditor label="6. Landlord's Covenants" value={data.landlords_covenants || ''} onChange={v => setF('landlords_covenants', v)} minHeight={150} />
            </div>

            <CollapsibleSection title="7. Special Provisions">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Notice to Quit (months)</label>
                  <input type="number" min="1" value={data.special_provisions?.notice_to_quit_months ?? 3} onChange={e => setF('special_provisions.notice_to_quit_months', Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Termination Notice (months)</label>
                  <input type="number" min="1" value={data.special_provisions?.termination_notice_months ?? 3} onChange={e => setF('special_provisions.termination_notice_months', Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Holding Over (days)</label>
                  <input type="number" min="1" value={data.special_provisions?.holding_over_days ?? 7} onChange={e => setF('special_provisions.holding_over_days', Number(e.target.value))} className="w-full" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Communication Methods</label>
                  <textarea value={data.special_provisions?.communication_methods || ''} onChange={e => setF('special_provisions.communication_methods', e.target.value)} rows={2} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Renewal Request (months before expiry)</label>
                  <input type="number" min="1" value={data.special_provisions?.renewal_request_months ?? 3} onChange={e => setF('special_provisions.renewal_request_months', Number(e.target.value))} className="w-full" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Rent Review Notice (months)</label>
                  <input type="number" min="1" value={data.special_provisions?.rent_review_notice_months ?? 2} onChange={e => setF('special_provisions.rent_review_notice_months', Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Reply to Rent Review (weeks)</label>
                  <input type="number" min="1" value={data.special_provisions?.rent_review_reply_weeks ?? 2} onChange={e => setF('special_provisions.rent_review_reply_weeks', Number(e.target.value))} className="w-full" />
                </div>
              </div>
              <div className="mt-4">
                <RichTextEditor label="Extra Clauses" value={data.special_provisions?.extra_clauses || ''} onChange={v => setF('special_provisions.extra_clauses', v)} minHeight={120} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="8. Execution / Signature">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Landlord Signature Label</label>
                  <input value={data.execution?.landlord_label || ''} onChange={e => setF('execution.landlord_label', e.target.value)} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Tenant Signature Label</label>
                  <input value={data.execution?.tenant_label || ''} onChange={e => setF('execution.tenant_label', e.target.value)} className="w-full" />
                </div>
              </div>
            </CollapsibleSection>

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
