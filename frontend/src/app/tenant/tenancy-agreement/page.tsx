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

export default function TenancyAgreementPage() {
  const router = useRouter();
  const [agreement, setAgreement] = useState<TenancyDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [message, setMessage] = useState('');

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
        { signature_name: tenantName },
        { headers: getAuthHeaders() }
      );
      setMessage('signed');
      const { data } = await axios.get<TenancyDocument>(`${API_URL}/tenant/me/agreement/`, { headers: getAuthHeaders() });
      setAgreement(data);
    } catch {
      setMessage('Failed to sign agreement. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PM</span>
                </div>
                <span className="font-bold text-lg">PropManager</span>
              </div>
              <button onClick={() => router.push('/tenant/dashboard')} className="text-sm text-primary-600 font-medium">Back to Dashboard</button>
            </div>
          </div>
        </nav>
        <main className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Tenancy Agreement</h1>
          <p className="text-gray-500">{error}</p>
        </main>
      </div>
    );
  }

  const data = agreement?.document_data as Record<string, any> || {};
  const parties = data?.parties || {};
  const property = data?.property || {};
  const financial = data?.financial_terms || {};
  const obligations = data?.obligations || {};
  const termination = data?.termination || {};
  const isSigned = agreement?.status === 'signed';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <span className="font-bold text-lg">PropManager</span>
            </div>
            <button onClick={() => router.push('/tenant/dashboard')} className="text-sm text-primary-600 font-medium">Back to Dashboard</button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && message !== 'signed' && (
          <div className="px-4 py-3 rounded-lg text-sm mb-6 bg-red-50 text-red-700">{message}</div>
        )}

        <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8 space-y-8">
          <div className="text-center border-b pb-6">
            <h1 className="text-2xl font-bold">{agreement?.document_type === 'tenancy_agreement' ? 'TENANCY AGREEMENT' : 'Agreement'}</h1>
            <p className="text-gray-500 text-sm mt-1">
              This agreement is made on {agreement?.sent_at ? new Date(agreement.sent_at).toLocaleDateString() : '...'}
            </p>
          </div>

          <section>
            <h2 className="text-lg font-semibold mb-3">Parties</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Landlord</p>
                <p className="font-medium">{parties.landlord_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tenant</p>
                <p className="font-medium">{parties.tenant_name || 'N/A'}</p>
              </div>
            </div>
            {parties.landlord_address && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Landlord Address</p>
                <p className="font-medium">{parties.landlord_address}</p>
              </div>
            )}
            {parties.landlord_phone && (
              <div className="mt-1">
                <p className="text-sm text-gray-500">Landlord Phone</p>
                <p className="font-medium">{parties.landlord_phone}</p>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Property</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{property.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit</p>
                <p className="font-medium">{property.unit_number || 'N/A'}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Financial Terms</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['Annual Rent', financial.annual_rent ? `₦${Number(financial.annual_rent).toLocaleString()}` : 'N/A'],
                    ['Security Deposit', financial.security_deposit || 'N/A'],
                    ['Payment Due Date', financial.payment_due_date || 'N/A'],
                    ['Late Payment Fee', financial.late_fee || 'N/A'],
                  ].map(([label, value]) => (
                    <tr key={label} className="border-b">
                      <td className="py-2 pr-8 font-medium text-gray-600">{label}</td>
                      <td className="py-2">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Term</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{financial.lease_start || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expiry Date</p>
                <p className="font-medium">{financial.lease_expiry || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{financial.duration || 'N/A'}</p>
              </div>
            </div>
          </section>

          {obligations.landlord && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Landlord Obligations</h2>
              <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: obligations.landlord }} />
            </section>
          )}

          {obligations.tenant && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Tenant Obligations</h2>
              <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: obligations.tenant }} />
            </section>
          )}

          {termination && Object.keys(termination).length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Termination</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-500">Notice Period</p>
                  <p className="font-medium">{termination.notice_period || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Early Termination Fee</p>
                  <p className="font-medium">{termination.early_termination_fee || 'N/A'}</p>
                </div>
              </div>
              {termination.conditions && (
                <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: termination.conditions }} />
              )}
            </section>
          )}

          {data.additional_clauses && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Additional Clauses</h2>
              <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: data.additional_clauses }} />
            </section>
          )}

          <div className="border-t pt-6">
            {isSigned ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <span className="font-medium">Signed on {agreement?.signed_at ? new Date(agreement.signed_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                {agreement?.signed_file_url && (
                  <div>
                    <a href={agreement.signed_file_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary inline-flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Download Signed Agreement (PDF)
                    </a>
                  </div>
                )}
                {agreement?.file_url && (
                  <p className="text-sm text-gray-500">
                    You may also <a href={agreement.file_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">view the unsigned version</a>.
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
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    I have read and agree to the terms and conditions of this tenancy agreement. I understand that this constitutes my electronic signature.
                  </span>
                </label>
                <button
                  onClick={handleSign}
                  disabled={!agreed || signing}
                  className="btn btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signing ? 'Signing...' : 'Sign Agreement'}
                </button>
              </div>
            )}
          </div>
        </div>

        {message === 'signed' && (
          <div className="mt-4 px-4 py-3 rounded-lg text-sm bg-green-50 text-green-700">
            Agreement signed successfully!{' '}
            <button onClick={() => router.push('/tenant/dashboard')} className="underline font-medium">Return to Dashboard</button>
          </div>
        )}
      </main>
    </div>
  );
}
