'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '../../../components/DashboardLayout';
import ErrorBoundary from '../../../components/ErrorBoundary';
import RichTextEditor from '../../../components/RichTextEditor';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import type { Property, TenancyAgreementTemplate } from '../../../types';

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
  const t = useTranslations('AgreementTemplate');
  return <div className="border-t mt-4 pt-4" style={{ borderColor: 'var(--border)' }}>
    <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text)' }}>{t('cautionFee')}</h3>
    <FieldPreview label={t('amount')} value={cf.currency ? `${cf.currency} ${cf.amount}` : cf.amount} />
    <FieldPreview label={t('type')} value={cf.type} />
    <div className="mt-2">
      <p className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>{t('deductedFor')}</p>
      <RichTextPreview html={cf.deducted_for} />
    </div>
    <div className="mt-2">
      <p className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>{t('refundedIf')}</p>
      <RichTextPreview html={cf.refunded_if} />
    </div>
    <div className="mt-2">
      <p className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>{t('topUp')}</p>
      <RichTextPreview html={cf.top_up} />
    </div>
  </div>;
}

function SignaturePreview({ exec, landlordName }: { exec: Record<string, any>; landlordName?: string }) {
  const t = useTranslations('AgreementTemplate');
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return <div className="border-t pt-6" style={{ borderColor: 'var(--border)' }}>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
      <div>
        <p className="text-sm font-medium mb-6" style={{ color: 'var(--text)' }}>{exec.landlord_label || t('defaultLandlordLabel')}</p>
        <div className="border-b pb-6 mb-2" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text)' }}>{t('signature')}: <span className="font-medium">{landlordName || '________________________'}</span></p>
          <p className="text-xs mt-4" style={{ color: 'var(--text)' }}>{t('date')}: <span className="font-medium">{today}</span></p>
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>{t('witnessLandlord')}</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-light)' }}>
            {t('witnessName')}: {exec.witness_landlord_name || '______________________________'}<br />
            {t('witnessAddress')}: {exec.witness_landlord_address || '____________________________'}<br />
            {t('signature')}: ______________________________<br />
            {t('date')}: {today}
          </p>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-6" style={{ color: 'var(--text)' }}>{exec.tenant_label || t('defaultTenantLabel')}</p>
        <div className="border-b pb-6 mb-2" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-light)' }}>{t('signature')}: ______________________________</p>
          <p className="text-xs mt-4" style={{ color: 'var(--text-light)' }}>{t('date')}: ______________________________</p>
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>{t('witnessTenant')}</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-light)' }}>
            {t('witnessName')}: ______________________________<br />{t('witnessAddress')}: ______________________________<br />Occupation: ______________________________<br />{t('signature')}: ______________________________<br />{t('date')}: ______________________________
          </p>
        </div>
      </div>
    </div>
  </div>;
}

export default function AgreementTemplatePage() {
  const t = useTranslations('AgreementTemplate');
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
  const [mode, setMode] = useState<'template' | 'uploaded_pdf'>('template');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [data, setData] = useState<Record<string, any>>(JSON.parse(JSON.stringify(EMPTY_TEMPLATE)));
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/properties/'),
      api.get('/agreement-templates/'),
    ]).then(([pRes, tRes]) => {
      setProperties(pRes.data.results || pRes.data);
      setTemplates(tRes.data.results || tRes.data);
    }).catch(() => toast(t('loadFailed'), 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedPropertyId) return;
    const existing = templates.find(t => t.property === selectedPropertyId);
    if (existing) {
      setTemplateId(existing.id);
      setTitle(existing.title);
      setLogoUrl(existing.logo_url || '');
      setMode(existing.mode || 'template');
      setUploadedPdfUrl(existing.uploaded_pdf_url || '');
      const merged = JSON.parse(JSON.stringify(EMPTY_TEMPLATE));
      deepMerge(merged, existing.template_data);
      setData(merged);
    } else {
      setTemplateId(null);
      setTitle('Tenancy Agreement');
      setLogoUrl('');
      setMode('template');
      setUploadedPdfUrl('');
      setPdfFile(null);
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
    if (!selectedPropertyId) { toast(t('selectProperty'), 'error'); return; }
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

      let pdf_url = uploadedPdfUrl;
      if (mode === 'uploaded_pdf' && pdfFile) {
        if (templateId) {
          const fd = new FormData();
          fd.append('file', pdfFile);
          const { data: pdfRes } = await api.post(`/agreement-templates/${templateId}/upload-pdf/`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          pdf_url = pdfRes.uploaded_pdf_url;
          setUploadedPdfUrl(pdf_url);
        }
      }

      const payload: Record<string, any> = {
        property_id: selectedPropertyId,
        title,
        logo_url,
        mode,
      };

      if (mode === 'uploaded_pdf') {
        payload.template_data = {};
        payload.uploaded_pdf_url = pdf_url;
      } else {
        payload.template_data = data;
      }

      if (templateId) {
        await api.put(`/agreement-templates/${templateId}/`, payload);
        toast(t('updated'), 'success');
      } else {
        const res = await api.post('/agreement-templates/', payload);
        setTemplateId(res.data.id);
        if (mode === 'uploaded_pdf' && pdfFile && !pdf_url) {
          const fd = new FormData();
          fd.append('file', pdfFile);
          const { data: pdfRes } = await api.post(`/agreement-templates/${res.data.id}/upload-pdf/`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          setUploadedPdfUrl(pdfRes.uploaded_pdf_url);
        }
        toast(t('created'), 'success');
      }
      const { data: tRes } = await api.get('/agreement-templates/');
      setTemplates(tRes.results || tRes);
    } catch {
      toast(t('saveFailed'), 'error');
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
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{t('pageTitle')}</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-light)' }}>
              {t('pageSubtitle')}
            </p>
          </div>
        </div>

        <div className="card mb-6">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('property')} *</label>
          <select value={selectedPropertyId} onChange={e => setSelectedPropertyId(Number(e.target.value) || '')} className="w-full">
            <option value="">{t('selectProperty')}</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {templates.find(t => t.property === p.id) ? `(${t('hasTemplate')})` : `(${t('noTemplate')})`}
              </option>
            ))}
          </select>
        </div>

        {selectedPropertyId && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>{t('agreementMode')}</h2>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="agreement-mode"
                    checked={mode === 'template'}
                    onChange={() => setMode('template')}
                    className="h-4 w-4 text-primary-600"
                  />
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{t('useTemplate')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="agreement-mode"
                    checked={mode === 'uploaded_pdf'}
                    onChange={() => setMode('uploaded_pdf')}
                    className="h-4 w-4 text-primary-600"
                  />
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{t('uploadPdf')}</span>
                </label>
              </div>
            </div>

            {mode === 'uploaded_pdf' ? (
              <div className="card">
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>{t('uploadedPdfAgreement')}</h2>
                <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
                  {t('uploadedPdfDescription')}
                </p>
                <div>
                  <input type="file" accept=".pdf" onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setPdfFile(file);
                    if (!file) {
                      setUploadedPdfUrl(uploadedPdfUrl);
                    }
                  }} className="text-sm" />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>
                    {uploadedPdfUrl ? `${t('currentFile')}: ${uploadedPdfUrl}` : t('uploadPdfFile')}
                  </p>
                </div>
                {uploadedPdfUrl && (
                  <div className="mt-4">
                    <a href={uploadedPdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline text-sm">{t('viewCurrentPdf')}</a>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-6">
                  <button onClick={handleSave} disabled={saving} className="btn btn-primary disabled:opacity-50">
                    {saving ? t('saving') : templateId ? t('updateTemplate') : t('createTemplate')}
                  </button>
                </div>
              </div>
            ) : (
              <>
            <div className="card">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>{t('header')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('agreementTitle')}</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('logo')}</label>
                  {logoUrl && <div className="mb-2"><img src={logoUrl} alt="Logo preview" className="h-16 object-contain border rounded" /></div>}
                  <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="text-sm" />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>
                    {logoUrl ? t('uploadReplace') : t('uploadLogo')}
                  </p>
                </div>
              </div>
            </div>

            <CollapsibleSection title={t('section1')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('companyName')}</label>
                  <input value={data.agent?.name || ''} onChange={e => setF('agent.name', e.target.value)} className="w-full" placeholder="e.g. Falobi Solid Rock and Associates" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('description')}</label>
                  <input value={data.agent?.description || ''} onChange={e => setF('agent.description', e.target.value)} className="w-full" placeholder="Estate Surveyors, Managers and Valuers" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('address')}</label>
                  <textarea value={data.agent?.address || ''} onChange={e => setF('agent.address', e.target.value)} rows={2} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('mobile')}</label>
                  <input value={data.agent?.mobile || ''} onChange={e => setF('agent.mobile', e.target.value)} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('email')}</label>
                  <input value={data.agent?.email || ''} onChange={e => setF('agent.email', e.target.value)} className="w-full" />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title={t('section2')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('landlordName')}</label>
                  <input value={data.landlord?.name || ''} onChange={e => setF('landlord.name', e.target.value)} className="w-full" placeholder="e.g. Ropedam Enterprises" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('landlordAddress')}</label>
                  <textarea value={data.landlord?.address || ''} onChange={e => setF('landlord.address', e.target.value)} rows={2} className="w-full" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('legalNote')}</label>
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
                  <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{t('propertyAutoPopulated')}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>
                    {t('propertyAutoPopulatedDesc')}
                  </p>
                </div>
              </div>
            </div>

            <CollapsibleSection title={t('section3')}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('type')}</label>
                  <input value={data.tenancy_terms?.type || ''} onChange={e => setF('tenancy_terms.type', e.target.value)} className="w-full" placeholder="Yearly Tenancy" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('currency')}</label>
                  <input value={data.tenancy_terms?.currency || ''} onChange={e => setF('tenancy_terms.currency', e.target.value)} className="w-full" placeholder="NGN" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('durationYears')}</label>
                  <input type="number" min="1" value={data.tenancy_terms?.duration_years || 1} onChange={e => setF('tenancy_terms.duration_years', Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('paymentTerms')}</label>
                  <input value={data.tenancy_terms?.payment || ''} onChange={e => setF('tenancy_terms.payment', e.target.value)} className="w-full" placeholder="Payable in advance" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('dueBy')}</label>
                  <input value={data.tenancy_terms?.due_by || ''} onChange={e => setF('tenancy_terms.due_by', e.target.value)} className="w-full" />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text)' }}>{t('legalReferences')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('propertyReferredToAs')}</label>
                    <input value={data.property?.referred_to_as || ''} onChange={e => setF('property.referred_to_as', e.target.value)} className="w-full" placeholder="The Demised Premises" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('ownershipNote')}</label>
                    <input value={data.property?.ownership_note || ''} onChange={e => setF('property.ownership_note', e.target.value)} className="w-full" placeholder="Bona fide property of the landlord" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text)' }}>{t('cautionFee')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('amount')}</label>
                    <input value={data.tenancy_terms?.caution_fee?.amount || ''} onChange={e => setF('tenancy_terms.caution_fee.amount', e.target.value)} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('type')}</label>
                    <input value={data.tenancy_terms?.caution_fee?.type || ''} onChange={e => setF('tenancy_terms.caution_fee.type', e.target.value)} className="w-full" placeholder="Refundable" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('currency')}</label>
                    <input value={data.tenancy_terms?.caution_fee?.currency || ''} onChange={e => setF('tenancy_terms.caution_fee.currency', e.target.value)} className="w-full" placeholder="NGN" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <RichTextEditor label={t('deductedFor')} value={data.tenancy_terms?.caution_fee?.deducted_for || ''} onChange={v => setF('tenancy_terms.caution_fee.deducted_for', v)} minHeight={100} />
                  <RichTextEditor label={t('refundedIf')} value={data.tenancy_terms?.caution_fee?.refunded_if || ''} onChange={v => setF('tenancy_terms.caution_fee.refunded_if', v)} minHeight={100} />
                  <RichTextEditor label={t('topUp')} value={data.tenancy_terms?.caution_fee?.top_up || ''} onChange={v => setF('tenancy_terms.caution_fee.top_up', v)} minHeight={100} />
                </div>
              </div>
            </CollapsibleSection>

            <div className="card">
              <RichTextEditor label={t('section4')} value={data.tenants_covenants || ''} onChange={v => setF('tenants_covenants', v)} minHeight={250} />
            </div>

            <div className="card">
              <RichTextEditor label={t('section5')} value={data.landlords_covenants || ''} onChange={v => setF('landlords_covenants', v)} minHeight={150} />
            </div>

            <CollapsibleSection title={t('section6')}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('noticeToQuit')}</label>
                  <input type="number" min="1" value={data.special_provisions?.notice_to_quit_months ?? 3} onChange={e => setF('special_provisions.notice_to_quit_months', Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('terminationNotice')}</label>
                  <input type="number" min="1" value={data.special_provisions?.termination_notice_months ?? 3} onChange={e => setF('special_provisions.termination_notice_months', Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('holdingOver')}</label>
                  <input type="number" min="1" value={data.special_provisions?.holding_over_days ?? 7} onChange={e => setF('special_provisions.holding_over_days', Number(e.target.value))} className="w-full" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('communicationMethods')}</label>
                  <textarea value={data.special_provisions?.communication_methods || ''} onChange={e => setF('special_provisions.communication_methods', e.target.value)} rows={2} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('renewalRequest')}</label>
                  <input type="number" min="1" value={data.special_provisions?.renewal_request_months ?? 3} onChange={e => setF('special_provisions.renewal_request_months', Number(e.target.value))} className="w-full" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('rentReviewNotice')}</label>
                  <input type="number" min="1" value={data.special_provisions?.rent_review_notice_months ?? 2} onChange={e => setF('special_provisions.rent_review_notice_months', Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('rentReviewReply')}</label>
                  <input type="number" min="1" value={data.special_provisions?.rent_review_reply_weeks ?? 2} onChange={e => setF('special_provisions.rent_review_reply_weeks', Number(e.target.value))} className="w-full" />
                </div>
              </div>
              <div className="mt-4">
                <RichTextEditor label={t('extraClauses')} value={data.special_provisions?.extra_clauses || ''} onChange={v => setF('special_provisions.extra_clauses', v)} minHeight={120} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title={t('section7')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('landlordSignatureLabel')}</label>
                  <input value={data.execution?.landlord_label || ''} onChange={e => setF('execution.landlord_label', e.target.value)} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('tenantSignatureLabel')}</label>
                  <input value={data.execution?.tenant_label || ''} onChange={e => setF('execution.tenant_label', e.target.value)} className="w-full" />
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text)' }}>{t('landlordWitness')}</h3>
                <p className="text-xs mb-3" style={{ color: 'var(--text-light)' }}>{t('witnessDetailsNote')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('witnessName')}</label>
                    <input value={data.execution?.witness_landlord_name || ''} onChange={e => setF('execution.witness_landlord_name', e.target.value)} className="w-full" placeholder="Witness full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('witnessAddress')}</label>
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
                {t('preview')}
              </button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary disabled:opacity-50">
                {saving ? t('saving') : templateId ? t('updateTemplate') : t('createTemplate')}
              </button>
            </div>

            </>
          )}
        </div>
      )}

      {!selectedPropertyId && (
          <div className="card text-center py-12">
            <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>{t('selectPropertyTitle')}</h3>
            <p style={{ color: 'var(--text-light)' }}>{t('selectPropertySubtitle')}</p>
          </div>
        )}
      </DashboardLayout>

      {showPreview && previewProps && mode === 'template' && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
          <div className="min-h-full flex items-start justify-center p-4">
            <div className="w-full max-w-4xl rounded-xl shadow-2xl border p-6 sm:p-8 my-8 space-y-8" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between sticky top-0 pb-4 border-b z-10" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{t('preview')} — {title || 'Tenancy Agreement'}</h2>
                <button onClick={() => setShowPreview(false)} className="btn btn-secondary text-sm">{t('closePreview')}</button>
              </div>
              <div className="space-y-8">
                <HeaderPreview logoUrl={logoUrl} title={title} agent={previewProps.agent} />
                <SectionPreview title={t('previewSection1')}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldPreview label={t('previewLandlord')} value={previewProps.landlord.name || '—'} />
                    <FieldPreview label={t('previewTenant')} value={t('previewTenantAuto')} />
                  </div>
                  <FieldPreview label={t('previewLandlordAddress')} value={previewProps.landlord.address} />
                  <FieldPreview label={t('previewLegalNote')} value={previewProps.landlord.legal_note} />
                </SectionPreview>
                <SectionPreview title={t('previewSection2')}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldPreview label={t('previewName')} value={previewProps.prop?.name} />
                    <FieldPreview label={t('previewType')} value={previewProps.prop?.property_type} />
                  </div>
                  <FieldPreview label={t('previewDescription')} value={previewProps.prop?.description} />
                  <FieldPreview label={t('previewAddress')} value={previewProps.prop?.address} />
                  <FieldPreview label={t('previewUnit')} value={t('previewUnitAuto')} />
                  <FieldPreview label={t('previewReferredToAs')} value={previewProps.pty.referred_to_as} />
                  <FieldPreview label={t('previewOwnershipNote')} value={previewProps.pty.ownership_note} />
                </SectionPreview>
                <SectionPreview title={t('previewSection3')}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FieldPreview label={t('previewType')} value={previewProps.tt.type} />
                    <FieldPreview label={t('previewDuration')} value={previewProps.tt.duration_years ? `${previewProps.tt.duration_years} ${t('yearCount', { count: previewProps.tt.duration_years })}` : undefined} />
                    <FieldPreview label={t('previewPayment')} value={previewProps.tt.payment} />
                  </div>
                  <FieldPreview label={t('previewDueBy')} value={previewProps.tt.due_by} />
                  {previewProps.cf.amount && <CautionFeePreview cf={previewProps.cf} />}
                </SectionPreview>
                <SectionPreview title={t('previewSection4')}>
                  <RichTextPreview html={data.tenants_covenants} />
                </SectionPreview>
                <SectionPreview title={t('previewSection5')}>
                  <RichTextPreview html={data.landlords_covenants} />
                </SectionPreview>
                <SectionPreview title={t('previewSection6')}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FieldPreview label={t('previewNoticeToQuit')} value={previewProps.sp.notice_to_quit_months ? `${previewProps.sp.notice_to_quit_months} ${t('monthCount', { count: previewProps.sp.notice_to_quit_months })}` : undefined} />
                    <FieldPreview label={t('previewTerminationNotice')} value={previewProps.sp.termination_notice_months ? `${previewProps.sp.termination_notice_months} ${t('monthCount', { count: previewProps.sp.termination_notice_months })}` : undefined} />
                    <FieldPreview label={t('previewHoldingOver')} value={previewProps.sp.holding_over_days ? `${previewProps.sp.holding_over_days} ${t('dayCount', { count: previewProps.sp.holding_over_days })}` : undefined} />
                  </div>
                  <FieldPreview label={t('previewRenewalRequest')} value={previewProps.sp.renewal_request_months ? `${previewProps.sp.renewal_request_months} ${t('renewalRequestValue', { count: previewProps.sp.renewal_request_months })}` : undefined} />
                  <FieldPreview label={t('previewCommunication')} value={previewProps.sp.communication_methods} />
                  <FieldPreview label={t('previewRentReviewNotice')} value={previewProps.sp.rent_review_notice_months ? `${previewProps.sp.rent_review_notice_months} ${t('monthCount', { count: previewProps.sp.rent_review_notice_months })}` : undefined} />
                  <FieldPreview label={t('previewRentReviewReply')} value={previewProps.sp.rent_review_reply_weeks ? `${previewProps.sp.rent_review_reply_weeks} ${t('weekCount', { count: previewProps.sp.rent_review_reply_weeks })}` : undefined} />
                  {previewProps.sp.extra_clauses && <div className="mt-4"><h3 className="font-medium text-sm" style={{ color: 'var(--text)' }}>{t('previewExtraClauses')}</h3><RichTextPreview html={previewProps.sp.extra_clauses} /></div>}
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
