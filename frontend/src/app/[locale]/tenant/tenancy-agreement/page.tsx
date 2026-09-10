'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import axios from 'axios';
import type { TenancyDocument } from '../../../../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tenant_access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm" style={{ color: 'var(--text-light)' }}>{label}</p>
      <p className="font-medium" style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  );
}

function renderRichText(html?: string) {
  if (!html) return null;
  return <div className="prose prose-sm max-w-none mt-2" style={{ color: 'var(--text)' }} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function TenancyAgreementPage() {
  const t = useTranslations('TenantAgreement');
  const router = useRouter();
  const [agreement, setAgreement] = useState<TenancyDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [confirmedTruthful, setConfirmedTruthful] = useState(false);
  const [witnessName, setWitnessName] = useState('');
  const [witnessAddress, setWitnessAddress] = useState('');
  const [witnessOccupation, setWitnessOccupation] = useState('');
  const [signing, setSigning] = useState(false);
  const [message, setMessage] = useState('');
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [uploadingSigned, setUploadingSigned] = useState(false);
  const [emailing, setEmailing] = useState<string | null>(null);
  const isUploadedPdf = agreement?.mode === 'uploaded_pdf';
  const isPending = agreement?.status === 'pending_verification';
  const isSigned = agreement?.status === 'signed';

  useEffect(() => {
    const token = localStorage.getItem('tenant_access_token');
    if (!token) { router.push('/tenant/login'); return; }
    const headers = { Authorization: `Bearer ${token}` };

    axios.get<TenancyDocument>(`${API_URL}/tenant/me/agreement/`, { headers })
      .then(res => setAgreement(res.data))
      .catch(err => {
        if (err.response?.status === 404) {
          setError(t('noAgreementError'));
        } else {
          localStorage.removeItem('tenant_access_token');
          router.push('/tenant/login');
        }
      })
      .finally(() => setLoading(false));
  }, [router, t]);

  const handleSign = async () => {
    if (!agreement) return;
    setSigning(true);
    setMessage('');
    try {
      const token = localStorage.getItem('tenant_access_token');
      const meRes = await axios.get(`${API_URL}/tenant/me/`, { headers: { Authorization: `Bearer ${token}` } });
      const tenantName = meRes.data.name;
      await axios.post(
        `${API_URL}/tenant/me/documents/${agreement.id}/sign/`,
        {
          signature_name: tenantName,
          witness_name: witnessName,
          witness_address: witnessAddress,
          witness_occupation: witnessOccupation,
        },
        { headers: getAuthHeaders() }
      );
      setMessage('signed');
      const { data } = await axios.get<TenancyDocument>(`${API_URL}/tenant/me/agreement/`, { headers: getAuthHeaders() });
      setAgreement(data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setMessage(axiosError.response?.data?.error || t('toast.signFailed'));
    } finally {
      setSigning(false);
    }
  };

  const handleUploadSigned = async () => {
    if (!agreement || !signedFile) return;
    setUploadingSigned(true);
    setMessage('');
    try {
      const token = localStorage.getItem('tenant_access_token');
      await axios.get(`${API_URL}/tenant/me/agreement/?cleared=1`, { headers: { Authorization: `Bearer ${token}` } });
      const formData = new FormData();
      formData.append('signed_file', signedFile);
      await axios.post(
        `${API_URL}/tenant/me/documents/${agreement.id}/upload-signed/`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      setMessage('uploaded');
      const { data } = await axios.get<TenancyDocument>(`${API_URL}/tenant/me/agreement/`, { headers: getAuthHeaders() });
      setAgreement(data);
    } catch {
      setMessage(t('toast.uploadFailed'));
    } finally {
      setUploadingSigned(false);
    }
  };

  const handleEmail = async (type: 'signed' | 'unsigned') => {
    if (!agreement) return;
    setEmailing(type);
    setMessage('');
    try {
      await axios.post(
        `${API_URL}/tenant/me/documents/${agreement.id}/email-${type}/`,
        {},
        { headers: getAuthHeaders() }
      );
      setMessage(type === 'signed' ? t('toast.signedSent') : t('toast.unsignedSent'));
    } catch {
      setMessage(t('toast.sendFailed'));
    } finally {
      setEmailing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
        <nav className="border-b" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PM</span>
                </div>
                <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>PropManager</span>
              </div>
              <button onClick={() => router.push('/tenant/dashboard')} className="text-sm text-primary-600 font-medium">{t('backToDashboard')}</button>
            </div>
          </div>
        </nav>
        <main className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>{t('title')}</h1>
          <p style={{ color: 'var(--text-light)' }}>{error}</p>
        </main>
      </div>
    );
  }

  const d = agreement?.document_data as Record<string, any> || {};
  const agent = d?.agent || {};
  const landlord = d?.landlord || {};
  const property = d?.property || {};
  const tt = d?.tenancy_terms || {};
  const cf = tt?.caution_fee || {};
  const sp = d?.special_provisions || {};
  const exec = d?.execution || {};
  const tenantName = d?.tenant_name || d?.tenant?.name || 'Tenant';
  const tenantPhone = d?.tenant_phone || d?.tenant?.phone || '';
  const annualRent = d?.annual_rent || d?.tenant?.annual_rent || '';
  const leaseStart = d?.lease_start || d?.lease_start_date || '';
  const leaseExpiry = d?.lease_expiry || d?.lease_expiry_date || '';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <nav className="border-b" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>PropManager</span>
            </div>
            <button onClick={() => router.push('/tenant/dashboard')} className="text-sm text-primary-600 font-medium">{t('backToDashboard')}</button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && message !== 'signed' && (
          <div className="px-4 py-3 rounded-lg text-sm mb-6" style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>{message}</div>
        )}

        <div className="rounded-xl shadow-sm border p-6 sm:p-8 space-y-8" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div className="text-center border-b pb-6" style={{ borderColor: 'var(--border)' }}>
            {agreement?.document_type === 'tenancy_agreement' && !isUploadedPdf && (
              <>
                {agent.name && <p className="font-bold text-base" style={{ color: 'var(--text)' }}>{agent.name}</p>}
                {agent.description && <p className="text-sm" style={{ color: 'var(--text-light)' }}>{agent.description}</p>}
                {agent.address && <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>{agent.address}</p>}
                <div className="h-4" />
              </>
            )}
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{agreement?.document_type === 'tenancy_agreement' ? (isUploadedPdf ? t('title') : t('titleUpper')) : t('agreement')}</h1>
            {agreement?.sent_at && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
                {isUploadedPdf ? t('uploadedOn') : t('agreementMadeOn')}{new Date(agreement.sent_at).toLocaleDateString()}
              </p>
            )}
          </div>

          {isUploadedPdf ? (
            <div className="space-y-6">
              <div className="card p-4 text-center">
                <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
                  {t('pdfInstructions')}
                </p>
                {agreement?.id && (
                  <button onClick={() => handleEmail('unsigned')} disabled={emailing === 'unsigned'} className="btn btn-primary inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {emailing === 'unsigned' ? t('sending') : t('sendToMyEmail')}
                  </button>
                )}
              </div>

              {isSigned && agreement?.signed_file_url && (
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <span className="font-medium">{t('verifiedOn', { date: agreement?.signed_at ? new Date(agreement.signed_at).toLocaleDateString() : 'N/A' })}</span>
                  </div>
                  <button onClick={() => handleEmail('signed')} disabled={emailing === 'signed'} className="btn btn-primary inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {emailing === 'signed' ? t('sending') : t('sendSignedToMyEmail')}
                  </button>
                </div>
              )}

              {isPending && (
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: '#fefce8', color: '#a16207' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="font-medium">{t('submittedForVerification')}</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-light)' }}>{t('verificationPendingNote')}</p>
                </div>
              )}

              {!isSigned && !isPending && (
                <div className="space-y-4 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
                  {agreement?.verification_note && (
                    <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>
                      <p className="font-medium mb-1">{t('notAccepted')}</p>
                      <p><b>{t('reason')}:</b> {agreement.verification_note}</p>
                      <p className="mt-1">{t('uploadCorrected')}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t('uploadSignedCopy')}</label>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-light)' }}>{t('uploadInstructions')}</p>
                    <input type="file" accept=".pdf,image/*" onChange={e => setSignedFile(e.target.files?.[0] || null)} className="text-sm" />
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmedTruthful}
                      onChange={e => setConfirmedTruthful(e.target.checked)}
                      className="mt-1 h-4 w-4 text-primary-600 rounded"
                      style={{ borderColor: 'var(--border)' }}
                    />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      {t('confirmationText')}
                    </span>
                  </label>
                  <button
                    onClick={handleUploadSigned}
                    disabled={!signedFile || !confirmedTruthful || uploadingSigned}
                    className="btn btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingSigned ? t('uploading') : t('uploadSignedAgreement')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
          <Section title={t('section.parties')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('field.landlord')} value={landlord.name} />
              <Field label={t('field.tenant')} value={tenantName} />
            </div>
            {landlord.address && (
              <div className="mt-2">
                <Field label={t('field.landlordAddress')} value={landlord.address} />
              </div>
            )}
            {landlord.legal_note && (
              <p className="text-xs mt-1 italic" style={{ color: 'var(--text-light)' }}>{landlord.legal_note}</p>
            )}
            <p className="text-xs mt-2 italic" style={{ color: 'var(--text-light)' }}>{d.tenants_legal_note || t('defaultLegalNote')}</p>
          </Section>

          <Section title={t('section.property')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('field.description')} value={property.description} />
              <Field label={t('field.address')} value={property.address} />
            </div>
            {property.referred_to_as && <Field label={t('field.referredToAs')} value={property.referred_to_as} />}
            {property.ownership_note && <Field label={t('field.ownership')} value={property.ownership_note} />}
          </Section>

          <Section title={t('section.tenancyTerms')}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={t('field.type')} value={tt.type} />
              <Field label={t('field.duration')} value={tt.duration_years ? t('yearCount', { count: tt.duration_years }) : undefined} />
              <Field label={t('field.payment')} value={tt.payment} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Field label={t('field.annualRent')} value={annualRent ? `NGN ${Number(annualRent).toLocaleString()}` : undefined} />
              <Field label={t('field.dueBy')} value={tt.due_by} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <Field label={t('field.leaseStart')} value={leaseStart} />
              <Field label={t('field.leaseExpiry')} value={leaseExpiry} />
              <Field label={t('field.tenantPhone')} value={tenantPhone} />
            </div>

            {cf.amount && (
              <div className="border-t mt-4 pt-4" style={{ borderColor: 'var(--border)' }}>
                <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text)' }}>{t('cautionFee')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label={t('field.amount')} value={cf.currency ? `${cf.currency} ${cf.amount}` : cf.amount} />
                  <Field label={t('field.type')} value={cf.type} />
                </div>
                <div className="grid grid-cols-1 gap-4 mt-2">
                  <Field label={t('field.deductedFor')} value={cf.deducted_for} />
                  <Field label={t('field.refundedIf')} value={cf.refunded_if} />
                  <Field label={t('field.topUp')} value={cf.top_up} />
                </div>
              </div>
            )}
          </Section>

          <Section title={t('section.tenantsCovenants')}>
            {renderRichText(d.tenants_covenants)}
            {!d.tenants_covenants && <p className="text-sm" style={{ color: 'var(--text-light)' }}>{t('defaultTenantsCovenants')}</p>}
          </Section>

          <Section title={t('section.landlordsCovenants')}>
            {renderRichText(d.landlords_covenants)}
            {!d.landlords_covenants && <p className="text-sm" style={{ color: 'var(--text-light)' }}>{t('defaultLandlordsCovenants')}</p>}
          </Section>

          <Section title={t('section.specialProvisions')}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label={t('field.noticeToQuit')} value={sp.notice_to_quit_months ? t('monthCount', { count: sp.notice_to_quit_months }) : undefined} />
              <Field label={t('field.terminationNotice')} value={sp.termination_notice_months ? t('monthCount', { count: sp.termination_notice_months }) : undefined} />
              <Field label={t('field.holdingOver')} value={sp.holding_over_days ? t('dayCount', { count: sp.holding_over_days }) : undefined} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Field label={t('field.renewalRequest')} value={sp.renewal_request_months ? t('renewalRequestValue', { count: sp.renewal_request_months }) : undefined} />
              <Field label={t('field.communication')} value={sp.communication_methods} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Field label={t('field.rentReviewNotice')} value={sp.rent_review_notice_months ? t('monthCount', { count: sp.rent_review_notice_months }) : undefined} />
              <Field label={t('field.rentReviewReply')} value={sp.rent_review_reply_weeks ? t('weekCount', { count: sp.rent_review_reply_weeks }) : undefined} />
            </div>
            {sp.extra_clauses && (
              <div className="mt-4">
                <h3 className="font-medium text-sm" style={{ color: 'var(--text)' }}>{t('extraClauses')}</h3>
                {renderRichText(sp.extra_clauses)}
              </div>
            )}
          </Section>

          <div className="border-t pt-6" style={{ borderColor: 'var(--border)' }}>
            {isSigned ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <span className="font-medium">{t('signedOnDate', { date: agreement?.signed_at ? new Date(agreement.signed_at).toLocaleDateString() : 'N/A' })}</span>
                </div>
                {agreement?.id && (
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button onClick={() => handleEmail('signed')} disabled={emailing === 'signed'} className="btn btn-primary inline-flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {emailing === 'signed' ? t('sending') : t('sendSignedToMyEmail')}
                    </button>
                    <button onClick={() => handleEmail('unsigned')} disabled={emailing === 'unsigned'} className="btn btn-outline inline-flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {emailing === 'unsigned' ? t('sending') : t('sendUnsignedToMyEmail')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary-600 rounded"
                    style={{ borderColor: 'var(--border)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--text)' }}>
                    {t('agreeToTerms')}
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmedTruthful}
                    onChange={e => setConfirmedTruthful(e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary-600 rounded"
                    style={{ borderColor: 'var(--border)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--text)' }}>
                    {t('confirmationText')}
                  </span>
                </label>
                <button
                  onClick={handleSign}
                  disabled={!agreed || !confirmedTruthful || signing}
                  className="btn btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signing ? t('signing') : t('signAgreement')}
                </button>
              </div>
            )}

            <div className="mt-8 border-t pt-6 grid grid-cols-1 sm:grid-cols-2 gap-8" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-sm font-medium mb-6" style={{ color: 'var(--text)' }}>{exec.landlord_label || t('landlordSignatureLabel')}</p>
                <div className="border-b pb-6 mb-2" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs" style={{ color: 'var(--text)' }}>{t('signature')}: <span className="font-medium">{landlord.name || '________________________'}</span></p>
                  <p className="text-xs mt-4" style={{ color: 'var(--text)' }}>{t('date')}: <span className="font-medium">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>{t('witnessLandlord')}</p>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-light)' }}>
                    {t('name')}: {exec.witness_landlord_name || '______________________________'}<br />
                    {t('address')}: {exec.witness_landlord_address || '____________________________'}<br />
                    {t('signature')}: ______________________________<br />
                    {t('date')}: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-6" style={{ color: 'var(--text)' }}>{exec.tenant_label || t('tenantSignatureLabel')}</p>
                <div className="border-b pb-6 mb-2" style={{ borderColor: 'var(--border)' }}>
                  {isSigned ? (
                    <>
                      <p className="text-xs" style={{ color: 'var(--text)' }}>{t('signature')}: <span className="font-medium">{tenantName}</span></p>
                      <p className="text-xs mt-4" style={{ color: 'var(--text)' }}>{t('date')}: <span className="font-medium">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs" style={{ color: 'var(--text-light)' }}>{t('signature')}: ______________________________</p>
                      <p className="text-xs mt-4" style={{ color: 'var(--text-light)' }}>{t('date')}: ______________________________</p>
                    </>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>{t('witnessTenant')}</p>
                  {isSigned ? (
                    <p className="text-xs mt-2" style={{ color: 'var(--text-light)' }}>
                      {t('name')}: {witnessName || '______________________________'}<br />
                      {t('address')}: {witnessAddress || '____________________________'}<br />
                      {t('occupation')}: {witnessOccupation || '____________________________'}<br />
                      {t('signature')}: ______________________________<br />
                      {t('date')}: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  ) : (
                    <div className="mt-2 space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>{t('witnessName')}</label>
                        <input value={witnessName} onChange={e => setWitnessName(e.target.value)} className="w-full text-sm" placeholder={t('witnessNamePlaceholder')} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>{t('witnessAddress')}</label>
                        <input value={witnessAddress} onChange={e => setWitnessAddress(e.target.value)} className="w-full text-sm" placeholder={t('witnessAddressPlaceholder')} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>{t('witnessOccupation')}</label>
                        <input value={witnessOccupation} onChange={e => setWitnessOccupation(e.target.value)} className="w-full text-sm" placeholder={t('witnessOccupationPlaceholder')} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>

        {message === 'signed' && (
          <div className="mt-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
            {t('toast.signedSuccess')}{' '}
            <button onClick={() => router.push('/tenant/dashboard')} className="underline font-medium">{t('returnToDashboard')}</button>
          </div>
        )}
        {message === 'uploaded' && (
          <div className="mt-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
            {t('toast.uploadedSuccess')}{' '}
            <button onClick={() => router.push('/tenant/dashboard')} className="underline font-medium">{t('returnToDashboard')}</button>
          </div>
        )}
      </main>
    </div>
  );
}
