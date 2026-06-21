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
  property: { referred_to_as: 'The Demised Premises', ownership_note: 'Bona fide property of the landlord' },
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
  execution: { landlord_label: 'Signed by the within-named LANDLORD', tenant_label: 'Signed by the within-named TENANT', witness_landlord_name: '', witness_landlord_address: '' },
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

function FieldPreview({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return <div><p className="text-sm" style={{ color: 'var(--text-light)' }}>{label}</p><p className="font-medium" style={{ color: 'var(--text)' }}>{value}</p></div>;
}

function SectionPreview({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>{title}</h2>{children}</section>;
}

function HeaderPreview({ logoUrl, title, agent }: { logoUrl: string; title: string; agent: Record<string, any> }) {
  return <div className="text-center border-b pb-6" style={{ borderColor: 'var(--border)' }}>
    {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 mx-auto mb-4 object-contain" />}
    {agent.name && <p className="font-bold text-base" style={{ color: 'var(--text)' }}>{agent.name}</p>}
    {agent.description && <p className="text-sm" style={{ color: 'var(--text-light)' }}>{agent.description}</p>}
    {agent.address && <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>{agent.address}</p>}
    <div className="h-4" />
    <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{title || 'TENANCY AGREEMENT'}</h1>
  </div>;
}

function RichTextPreview({ html }: { html?: string }) {
  if (!html) return <p className="text-sm italic" style={{ color: 'var(--text-light)' }}>Not configured</p>;
  return <div className="prose prose-sm max-w-none mt-2" style={{ color: 'var(--text)' }} dangerouslySetInnerHTML={{ __html: html }} />;
}

function CautionFeePreview({ cf }: { cf: Record<string, any> }) {
  return <div className="border-t mt-4 pt-4" style={{ borderColor: 'var(--border)' }}>
    <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text)' }}>Caution Fee</h3>
    <FieldPreview label="Amount" value={cf.currency ? `${cf.currency} ${cf.amount}` : cf.amount} />
    <FieldPreview label="Type" value={cf.type} />
    <FieldPreview label="Deducted For" value={cf.deducted_for} />
    <FieldPreview label="Refunded If" value={cf.refunded_if} />
    <FieldPreview label="Top Up" value={cf.top_up} />
  </div>;
}

function SignaturePreview({ exec, landlordName }: { exec: Record<string, any>; landlordName?: string }) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return <div className="border-t pt-6" style={{ borderColor: 'var(--border)' }}>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
      <div>
        <p className="text-sm font-medium mb-6" style={{ color: 'var(--text)' }}>{exec.landlord_label || 'Signed by the within-named LANDLORD'}</p>
        <div className="border-b pb-6 mb-2" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text)' }}>Signature: <span className="font-medium">{landlordName || '________________________'}</span></p>
          <p className="text-xs mt-4" style={{ color: 'var(--text)' }}>Date: <span className="font-medium">{today}</span></p>
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>Witness (Landlord)</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-light)' }}>
            Name: {exec.witness_landlord_name || '______________________________'}<br />
            Address: {exec.witness_landlord_address || '____________________________'}<br />
            Signature: ______________________________<br />
            Date: {today}
          </p>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-6" style={{ color: 'var(--text)' }}>{exec.tenant_label || 'Signed by the within-named TENANT'}</p>
        <div className="border-b pb-6 mb-2" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-light)' }}>Signature: ______________________________</p>
          <p className="text-xs mt-4" style={{ color: 'var(--text-light)' }}>Date: ______________________________</p>
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>Witness (Tenant)</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-light)' }}>
            Name: ______________________________<br />Address: ______________________________<br />Occupation: ______________________________<br />Signature: ______________________________<br />Date: ______________________________
          </p>
        </div>
      </div>
    </div>
  </div>;
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
  const [showPreview, setShowPreview] = useState(false);

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

  const previewProps = showPreview ? {
    prop: properties.find(p => p.id === selectedPropertyId),
    agent: data.agent || {},
    landlord: data.landlord || {},
    pty: data.property || {},
    tt: data.tenancy_terms || {},
    cf: (data.tenancy_terms || {}).caution_fee || {},
    sp: data.special_provisions || {},
    exec: data.execution || {},
  } : null;

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

            <div className="card p-4" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-light)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>Property details are automatically populated</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>
                    The property name, description, address, and type are pulled from your Property settings.
                    Each tenant&apos;s assigned unit number is added automatically.
                  </p>
                </div>
              </div>
            </div>

            <CollapsibleSection title="3. Tenancy Terms">
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
                <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text)' }}>Legal References</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Property Referred to As</label>
                    <input value={data.property?.referred_to_as || ''} onChange={e => setF('property.referred_to_as', e.target.value)} className="w-full" placeholder="The Demised Premises" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Ownership Note</label>
                    <input value={data.property?.ownership_note || ''} onChange={e => setF('property.ownership_note', e.target.value)} className="w-full" placeholder="Bona fide property of the landlord" />
                  </div>
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
              <RichTextEditor label="4. Tenant's Covenants" value={data.tenants_covenants || ''} onChange={v => setF('tenants_covenants', v)} minHeight={250} />
            </div>

            <div className="card">
              <RichTextEditor label="5. Landlord's Covenants" value={data.landlords_covenants || ''} onChange={v => setF('landlords_covenants', v)} minHeight={150} />
            </div>

            <CollapsibleSection title="6. Special Provisions">
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

            <CollapsibleSection title="7. Execution / Signature">
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
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text)' }}>Landlord's Witness</h3>
                <p className="text-xs mb-3" style={{ color: 'var(--text-light)' }}>These details appear in the signed document. The witness date is auto-populated.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Witness Name</label>
                    <input value={data.execution?.witness_landlord_name || ''} onChange={e => setF('execution.witness_landlord_name', e.target.value)} className="w-full" placeholder="Witness full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Witness Address</label>
                    <input value={data.execution?.witness_landlord_address || ''} onChange={e => setF('execution.witness_landlord_address', e.target.value)} className="w-full" placeholder="Witness address" />
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            <div className="flex justify-end gap-3 pb-8">
              <button type="button" onClick={() => setShowPreview(true)} className="btn btn-secondary">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
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

      {showPreview && previewProps && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
          <div className="min-h-full flex items-start justify-center p-4">
            <div className="w-full max-w-4xl rounded-xl shadow-2xl border p-6 sm:p-8 my-8 space-y-8" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between sticky top-0 pb-4 border-b z-10" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Preview — {title || 'Tenancy Agreement'}</h2>
                <button onClick={() => setShowPreview(false)} className="btn btn-secondary text-sm">Close Preview</button>
              </div>
              <div className="space-y-8">
                <HeaderPreview logoUrl={logoUrl} title={title} agent={previewProps.agent} />
                <SectionPreview title="1. Parties">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldPreview label="Landlord" value={previewProps.landlord.name || '—'} />
                    <FieldPreview label="Tenant" value="Tenant Name (auto-populated)" />
                  </div>
                  <FieldPreview label="Landlord Address" value={previewProps.landlord.address} />
                  <FieldPreview label="Legal Note" value={previewProps.landlord.legal_note} />
                </SectionPreview>
                <SectionPreview title="2. Property">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldPreview label="Name" value={previewProps.prop?.name} />
                    <FieldPreview label="Type" value={previewProps.prop?.property_type} />
                  </div>
                  <FieldPreview label="Description" value={previewProps.prop?.description} />
                  <FieldPreview label="Address" value={previewProps.prop?.address} />
                  <FieldPreview label="Unit" value="Auto-populated from tenant's assigned unit" />
                  <FieldPreview label="Referred to As" value={previewProps.pty.referred_to_as} />
                  <FieldPreview label="Ownership Note" value={previewProps.pty.ownership_note} />
                </SectionPreview>
                <SectionPreview title="3. Tenancy Terms">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FieldPreview label="Type" value={previewProps.tt.type} />
                    <FieldPreview label="Duration" value={previewProps.tt.duration_years ? `${previewProps.tt.duration_years} year(s)` : undefined} />
                    <FieldPreview label="Payment" value={previewProps.tt.payment} />
                  </div>
                  <FieldPreview label="Due By" value={previewProps.tt.due_by} />
                  {previewProps.cf.amount && <CautionFeePreview cf={previewProps.cf} />}
                </SectionPreview>
                <SectionPreview title="4. Tenant's Covenants">
                  <RichTextPreview html={data.tenants_covenants} />
                </SectionPreview>
                <SectionPreview title="5. Landlord's Covenants">
                  <RichTextPreview html={data.landlords_covenants} />
                </SectionPreview>
                <SectionPreview title="6. Special Provisions">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FieldPreview label="Notice to Quit" value={previewProps.sp.notice_to_quit_months ? `${previewProps.sp.notice_to_quit_months} month(s)` : undefined} />
                    <FieldPreview label="Termination Notice" value={previewProps.sp.termination_notice_months ? `${previewProps.sp.termination_notice_months} month(s)` : undefined} />
                    <FieldPreview label="Holding Over" value={previewProps.sp.holding_over_days ? `${previewProps.sp.holding_over_days} day(s)` : undefined} />
                  </div>
                  <FieldPreview label="Renewal Request" value={previewProps.sp.renewal_request_months ? `${previewProps.sp.renewal_request_months} month(s) before expiry` : undefined} />
                  <FieldPreview label="Communication" value={previewProps.sp.communication_methods} />
                  <FieldPreview label="Rent Review Notice" value={previewProps.sp.rent_review_notice_months ? `${previewProps.sp.rent_review_notice_months} month(s)` : undefined} />
                  <FieldPreview label="Rent Review Reply" value={previewProps.sp.rent_review_reply_weeks ? `${previewProps.sp.rent_review_reply_weeks} week(s)` : undefined} />
                  {previewProps.sp.extra_clauses && <div className="mt-4"><h3 className="font-medium text-sm" style={{ color: 'var(--text)' }}>Extra Clauses</h3><RichTextPreview html={previewProps.sp.extra_clauses} /></div>}
                </SectionPreview>
                <SignaturePreview exec={previewProps.exec} landlordName={previewProps.landlord.name} />
              </div>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}
