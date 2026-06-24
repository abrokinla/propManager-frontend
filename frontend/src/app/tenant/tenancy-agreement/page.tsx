'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import type { TenancyDocument } from '../../../types';

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
          setError('Your agent has not set up a tenancy agreement for your property yet. Please contact them.');
        } else {
          localStorage.removeItem('tenant_access_token');
          router.push('/tenant/login');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

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
      setMessage(axiosError.response?.data?.error || 'Failed to sign agreement. Please try again.');
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
      setMessage('Failed to upload signed agreement. Please try again.');
    } finally {
      setUploadingSigned(false);
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
              <button onClick={() => router.push('/tenant/dashboard')} className="text-sm text-primary-600 font-medium">Back to Dashboard</button>
            </div>
          </div>
        </nav>
        <main className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>Tenancy Agreement</h1>
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
            <button onClick={() => router.push('/tenant/dashboard')} className="text-sm text-primary-600 font-medium">Back to Dashboard</button>
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
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{agreement?.document_type === 'tenancy_agreement' ? (isUploadedPdf ? 'Tenancy Agreement' : 'TENANCY AGREEMENT') : 'Agreement'}</h1>
            {agreement?.sent_at && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
                {isUploadedPdf ? 'Uploaded on ' : 'This agreement is made on '}{new Date(agreement.sent_at).toLocaleDateString()}
              </p>
            )}
          </div>

          {isUploadedPdf ? (
            <div className="space-y-6">
              <div className="card p-4 text-center">
                <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
                  Your agent has uploaded a tenancy agreement as a PDF document. Please download it, print it, sign it manually, and upload the signed copy back.
                </p>
                {agreement?.id && (
                  <a href={`${API_URL}/public/document/${agreement.access_token}/download-unsigned/`} target="_blank" rel="noopener noreferrer" className="btn btn-primary inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Download Agreement (PDF)
                  </a>
                )}
              </div>

              {isSigned && agreement?.signed_file_url && (
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <span className="font-medium">Verified as signed on {agreement?.signed_at ? new Date(agreement.signed_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <a href={`${API_URL}/public/document/${agreement.access_token}/download-signed/`} target="_blank" rel="noopener noreferrer" className="btn btn-primary inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Download Signed Agreement (PDF)
                  </a>
                </div>
              )}

              {isPending && (
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: '#fefce8', color: '#a16207' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="font-medium">Submitted for verification</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-light)' }}>Your signed agreement has been submitted. Your agent will verify it shortly.</p>
                </div>
              )}

              {!isSigned && !isPending && (
                <div className="space-y-4 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
                  {agreement?.verification_note && (
                    <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>
                      <p className="font-medium mb-1">Your signed agreement was not accepted</p>
                      <p><b>Reason:</b> {agreement.verification_note}</p>
                      <p className="mt-1">Please upload a corrected signed copy below.</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Upload Signed Copy</label>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-light)' }}>After printing, signing, and scanning the agreement, upload the signed PDF here.</p>
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
                      I confirm that all information provided in this tenancy agreement is true and correct to the best of my knowledge, and I understand that I am liable for any defaults arising from any misrepresentation.
                    </span>
                  </label>
                  <button
                    onClick={handleUploadSigned}
                    disabled={!signedFile || !confirmedTruthful || uploadingSigned}
                    className="btn btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingSigned ? 'Uploading...' : 'Upload Signed Agreement'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
          <Section title="1. Parties">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Landlord" value={landlord.name} />
              <Field label="Tenant" value={tenantName} />
            </div>
            {landlord.address && (
              <div className="mt-2">
                <Field label="Landlord Address" value={landlord.address} />
              </div>
            )}
            {landlord.legal_note && (
              <p className="text-xs mt-1 italic" style={{ color: 'var(--text-light)' }}>{landlord.legal_note}</p>
            )}
            <p className="text-xs mt-2 italic" style={{ color: 'var(--text-light)' }}>{d.tenants_legal_note || 'Includes Successors in Title, Executors and Assigns'}</p>
          </Section>

          <Section title="2. Property">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Description" value={property.description} />
              <Field label="Address" value={property.address} />
            </div>
            {property.referred_to_as && <Field label="Referred to As" value={property.referred_to_as} />}
            {property.ownership_note && <Field label="Ownership" value={property.ownership_note} />}
          </Section>

          <Section title="3. Tenancy Terms">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Type" value={tt.type} />
              <Field label="Duration" value={tt.duration_years ? `${tt.duration_years} year(s)` : undefined} />
              <Field label="Payment" value={tt.payment} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Field label="Annual Rent" value={annualRent ? `NGN ${Number(annualRent).toLocaleString()}` : undefined} />
              <Field label="Due By" value={tt.due_by} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <Field label="Lease Start" value={leaseStart} />
              <Field label="Lease Expiry" value={leaseExpiry} />
              <Field label="Tenant Phone" value={tenantPhone} />
            </div>

            {cf.amount && (
              <div className="border-t mt-4 pt-4" style={{ borderColor: 'var(--border)' }}>
                <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text)' }}>Caution Fee</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Amount" value={cf.currency ? `${cf.currency} ${cf.amount}` : cf.amount} />
                  <Field label="Type" value={cf.type} />
                </div>
                <div className="grid grid-cols-1 gap-4 mt-2">
                  <Field label="Deducted For" value={cf.deducted_for} />
                  <Field label="Refunded If" value={cf.refunded_if} />
                  <Field label="Top Up" value={cf.top_up} />
                </div>
              </div>
            )}
          </Section>

          <Section title="4. Tenant's Covenants">
            {renderRichText(d.tenants_covenants)}
            {!d.tenants_covenants && <p className="text-sm" style={{ color: 'var(--text-light)' }}>The tenant agrees to the covenants set forth in this agreement.</p>}
          </Section>

          <Section title="5. Landlord's Covenants">
            {renderRichText(d.landlords_covenants)}
            {!d.landlords_covenants && <p className="text-sm" style={{ color: 'var(--text-light)' }}>The landlord agrees to the covenants set forth in this agreement.</p>}
          </Section>

          <Section title="6. Special Provisions">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Notice to Quit" value={sp.notice_to_quit_months ? `${sp.notice_to_quit_months} month(s)` : undefined} />
              <Field label="Termination Notice" value={sp.termination_notice_months ? `${sp.termination_notice_months} month(s)` : undefined} />
              <Field label="Holding Over" value={sp.holding_over_days ? `${sp.holding_over_days} day(s)` : undefined} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Field label="Renewal Request" value={sp.renewal_request_months ? `${sp.renewal_request_months} month(s) before expiry` : undefined} />
              <Field label="Communication" value={sp.communication_methods} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Field label="Rent Review Notice" value={sp.rent_review_notice_months ? `${sp.rent_review_notice_months} month(s)` : undefined} />
              <Field label="Rent Review Reply" value={sp.rent_review_reply_weeks ? `${sp.rent_review_reply_weeks} week(s)` : undefined} />
            </div>
            {sp.extra_clauses && (
              <div className="mt-4">
                <h3 className="font-medium text-sm" style={{ color: 'var(--text)' }}>Extra Clauses</h3>
                {renderRichText(sp.extra_clauses)}
              </div>
            )}
          </Section>

          <div className="border-t pt-6" style={{ borderColor: 'var(--border)' }}>
            {isSigned ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <span className="font-medium">Signed on {agreement?.signed_at ? new Date(agreement.signed_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                {agreement?.id && (
                  <div>
                    <a href={`${API_URL}/public/document/${agreement.access_token}/download-signed/`} target="_blank" rel="noopener noreferrer" className="btn btn-primary inline-flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Download Signed Agreement (PDF)
                    </a>
                  </div>
                )}
                {agreement?.id && (
                  <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                    You may also <a href={`${API_URL}/public/document/${agreement.access_token}/download-unsigned/`} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">view the unsigned version</a>.
                  </p>
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
                    I have read and agree to the terms and conditions of this tenancy agreement. I understand that this constitutes my electronic signature.
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
                    I confirm that all information provided in this tenancy agreement is true and correct to the best of my knowledge, and I understand that I am liable for any defaults arising from any misrepresentation.
                  </span>
                </label>
                <button
                  onClick={handleSign}
                  disabled={!agreed || !confirmedTruthful || signing}
                  className="btn btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signing ? 'Signing...' : 'Sign Agreement'}
                </button>
              </div>
            )}

            <div className="mt-8 border-t pt-6 grid grid-cols-1 sm:grid-cols-2 gap-8" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-sm font-medium mb-6" style={{ color: 'var(--text)' }}>{exec.landlord_label || 'Signed by the within-named LANDLORD'}</p>
                <div className="border-b pb-6 mb-2" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs" style={{ color: 'var(--text)' }}>Signature: <span className="font-medium">{landlord.name || '________________________'}</span></p>
                  <p className="text-xs mt-4" style={{ color: 'var(--text)' }}>Date: <span className="font-medium">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>Witness (Landlord)</p>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-light)' }}>
                    Name: {exec.witness_landlord_name || '______________________________'}<br />
                    Address: {exec.witness_landlord_address || '____________________________'}<br />
                    Signature: ______________________________<br />
                    Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-6" style={{ color: 'var(--text)' }}>{exec.tenant_label || 'Signed by the within-named TENANT'}</p>
                <div className="border-b pb-6 mb-2" style={{ borderColor: 'var(--border)' }}>
                  {isSigned ? (
                    <>
                      <p className="text-xs" style={{ color: 'var(--text)' }}>Signature: <span className="font-medium">{tenantName}</span></p>
                      <p className="text-xs mt-4" style={{ color: 'var(--text)' }}>Date: <span className="font-medium">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs" style={{ color: 'var(--text-light)' }}>Signature: ______________________________</p>
                      <p className="text-xs mt-4" style={{ color: 'var(--text-light)' }}>Date: ______________________________</p>
                    </>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>Witness (Tenant)</p>
                  {isSigned ? (
                    <p className="text-xs mt-2" style={{ color: 'var(--text-light)' }}>
                      Name: {witnessName || '______________________________'}<br />
                      Address: {witnessAddress || '____________________________'}<br />
                      Occupation: {witnessOccupation || '____________________________'}<br />
                      Signature: ______________________________<br />
                      Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  ) : (
                    <div className="mt-2 space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>Witness Name</label>
                        <input value={witnessName} onChange={e => setWitnessName(e.target.value)} className="w-full text-sm" placeholder="Full name of your witness" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>Witness Address</label>
                        <input value={witnessAddress} onChange={e => setWitnessAddress(e.target.value)} className="w-full text-sm" placeholder="Address of your witness" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>Witness Occupation</label>
                        <input value={witnessOccupation} onChange={e => setWitnessOccupation(e.target.value)} className="w-full text-sm" placeholder="Occupation of your witness" />
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
            Agreement signed successfully!{' '}
            <button onClick={() => router.push('/tenant/dashboard')} className="underline font-medium">Return to Dashboard</button>
          </div>
        )}
        {message === 'uploaded' && (
          <div className="mt-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
            Signed agreement uploaded successfully! It is now pending verification by your agent.{' '}
            <button onClick={() => router.push('/tenant/dashboard')} className="underline font-medium">Return to Dashboard</button>
          </div>
        )}
      </main>
    </div>
  );
}
