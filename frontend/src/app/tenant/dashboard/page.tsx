'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import type { TenantSelf, TenancyDocument, TenantProfile, Payment, DocumentStatus } from '../../../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getTenantToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tenant_access_token');
}

function getAuthHeaders() {
  const token = getTenantToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function TenantDashboardPage() {
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantSelf | null>(null);
  const [documents, setDocuments] = useState<TenancyDocument[]>([]);
  const [agreement, setAgreement] = useState<TenancyDocument | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState<TenantProfile>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', payment_method: 'Bank Transfer', payment_date: '' });
  const [payFile, setPayFile] = useState<File | null>(null);
  const [paySaving, setPaySaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = getTenantToken();
      if (!token) {
        router.push('/tenant/login');
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      const [meRes, docsRes, agrRes, payRes] = await Promise.all([
        axios.get<TenantSelf>(`${API_URL}/tenant/me/`, { headers }),
        axios.get<TenancyDocument[]>(`${API_URL}/tenant/me/documents/`, { headers }),
        axios.get<TenancyDocument>(`${API_URL}/tenant/me/agreement/`, { headers }).catch(() => null),
        axios.get<Payment[]>(`${API_URL}/tenant/me/payments/`, { headers }),
      ]);
      setTenant(meRes.data);
      setDocuments(docsRes.data);
      setAgreement(agrRes?.data || null);
      setPayments(payRes.data);
    } catch {
      localStorage.removeItem('tenant_access_token');
      localStorage.removeItem('tenant_refresh_token');
      localStorage.removeItem('tenant_user');
      router.push('/tenant/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('tenant_access_token');
    localStorage.removeItem('tenant_refresh_token');
    localStorage.removeItem('tenant_user');
    router.push('/tenant/login');
  };

  const startEdit = () => {
    if (!tenant) return;
    setProfileForm({
      phone: tenant.phone || '',
      address: tenant.address || '',
      occupation: tenant.occupation || '',
      employer_name: tenant.employer_name || '',
      employer_address: tenant.employer_address || '',
      next_of_kin_name: tenant.next_of_kin_name || '',
      next_of_kin_phone: tenant.next_of_kin_phone || '',
      next_of_kin_email: tenant.next_of_kin_email || '',
      next_of_kin_address: tenant.next_of_kin_address || '',
      emergency_contact_name: tenant.emergency_contact_name || '',
      emergency_contact_phone: tenant.emergency_contact_phone || '',
      guarantor_name: tenant.guarantor_name || '',
      guarantor_phone: tenant.guarantor_phone || '',
      guarantor_email: tenant.guarantor_email || '',
      guarantor_address: tenant.guarantor_address || '',
    });
    setEditing(true);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage('');
    try {
      await axios.put(`${API_URL}/tenant/me/complete-profile/`, profileForm, { headers: getAuthHeaders() });
      setMessage('Profile updated successfully.');
      setEditing(false);
      fetchData();
    } catch {
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const signDocument = async (docId: number) => {
    try {
      await axios.post(`${API_URL}/tenant/me/documents/${docId}/sign/`, { signature_name: tenant?.name }, { headers: getAuthHeaders() });
      setMessage('Document signed successfully.');
      fetchData();
    } catch {
      setMessage('Failed to sign document.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

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
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{tenant.name}</span>
              <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 font-medium">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`px-4 py-3 rounded-lg text-sm mb-6 ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Lease Summary */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4">Your Lease</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Property</p>
              <p className="font-medium">{tenant.property_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Unit</p>
              <p className="font-medium">{tenant.unit_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Annual Rent</p>
              <p className="font-medium">${tenant.annual_rent?.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className="badge badge-info">{tenant.tenancy_status?.replace(/_/g, ' ')}</span>
            </div>
          </div>
          {tenant.lease_start_date && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{new Date(tenant.lease_start_date).toLocaleDateString()}</p>
              </div>
              {tenant.lease_renewal_date && (
                <div>
                  <p className="text-sm text-gray-500">Renewal Date</p>
                  <p className="font-medium">{new Date(tenant.lease_renewal_date).toLocaleDateString()}</p>
                </div>
              )}
              {tenant.lease_expiry_date && (
                <div>
                  <p className="text-sm text-gray-500">Expiry Date</p>
                  <p className="font-medium">{new Date(tenant.lease_expiry_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tenancy Agreement */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Tenancy Agreement</h2>
            <button onClick={() => router.push('/tenant/tenancy-agreement')} className="btn btn-secondary text-sm">View Agreement</button>
          </div>
          <p className="text-sm text-gray-500">
            Status: <span className={`badge ${agreement?.status === 'signed' ? 'badge-success' : agreement?.status === 'sent' ? 'badge-info' : 'badge-warning'}`}>
              {agreement?.status === 'signed' ? 'Signed' : agreement?.status === 'sent' ? 'Awaiting Signature' : 'Not Available'}
            </span>
            {agreement?.signed_at && <> &middot; Signed {new Date(agreement.signed_at).toLocaleDateString()}</>}
          </p>
        </div>

        {/* Profile */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My Profile</h2>
            {!editing && (
              <button onClick={startEdit} className="btn btn-secondary text-sm">Edit Profile</button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input name="phone" value={profileForm.phone || ''} onChange={handleProfileChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input name="occupation" value={profileForm.occupation || ''} onChange={handleProfileChange} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea name="address" value={profileForm.address || ''} onChange={handleProfileChange} rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employer Name</label>
                  <input name="employer_name" value={profileForm.employer_name || ''} onChange={handleProfileChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employer Address</label>
                  <input name="employer_address" value={profileForm.employer_address || ''} onChange={handleProfileChange} />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-sm mb-3">Next of Kin</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input name="next_of_kin_name" value={profileForm.next_of_kin_name || ''} onChange={handleProfileChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input name="next_of_kin_phone" value={profileForm.next_of_kin_phone || ''} onChange={handleProfileChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input name="next_of_kin_email" value={profileForm.next_of_kin_email || ''} onChange={handleProfileChange} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea name="next_of_kin_address" value={profileForm.next_of_kin_address || ''} onChange={handleProfileChange} rows={2} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-sm mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input name="emergency_contact_name" value={profileForm.emergency_contact_name || ''} onChange={handleProfileChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input name="emergency_contact_phone" value={profileForm.emergency_contact_phone || ''} onChange={handleProfileChange} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-sm mb-3">Guarantor</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input name="guarantor_name" value={profileForm.guarantor_name || ''} onChange={handleProfileChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input name="guarantor_phone" value={profileForm.guarantor_phone || ''} onChange={handleProfileChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input name="guarantor_email" value={profileForm.guarantor_email || ''} onChange={handleProfileChange} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea name="guarantor_address" value={profileForm.guarantor_address || ''} onChange={handleProfileChange} rows={2} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button onClick={() => setEditing(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={saveProfile} disabled={saving} className="btn btn-primary disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{tenant.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{tenant.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{tenant.phone || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{tenant.address || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Occupation</p>
                <p className="font-medium">{tenant.occupation || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Employer</p>
                <p className="font-medium">{tenant.employer_name || '—'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4">Documents</h2>
          {documents.length === 0 ? (
            <p className="text-gray-500 text-sm">No documents yet.</p>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div>
                    <p className="font-medium capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-500">
                      Status: <span className="badge badge-info">{doc.status}</span>
                      {doc.sent_at && <> &middot; Sent {new Date(doc.sent_at).toLocaleDateString()}</>}
                      {doc.signed_at && <> &middot; Signed {new Date(doc.signed_at).toLocaleDateString()}</>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary text-sm">View</a>
                    )}
                    {doc.status === 'sent' && (
                      <button onClick={() => signDocument(doc.id)} className="btn btn-primary text-sm">Sign</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Payments */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Payments</h2>
            <button onClick={() => {
              setPayForm({ amount: tenant?.annual_rent?.toString() || '', payment_method: 'Bank Transfer', payment_date: new Date().toISOString().split('T')[0] });
              setShowPayForm(true);
            }} className="btn btn-primary text-sm">Pay Rent</button>
          </div>

          {showPayForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <h3 className="font-semibold text-lg mb-4">Pay Rent</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setPaySaving(true);
                  try {
                    const formData = new FormData();
                    formData.append('amount', payForm.amount);
                    formData.append('payment_method', payForm.payment_method);
                    formData.append('payment_date', payForm.payment_date);
                    if (payFile) formData.append('proof', payFile);
                    await axios.post(`${API_URL}/tenant/me/payments/`, formData, {
                      headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
                    });
                    setMessage('Payment submitted successfully.');
                    setShowPayForm(false);
                    setPayFile(null);
                    const { data } = await axios.get<Payment[]>(`${API_URL}/tenant/me/payments/`, { headers: getAuthHeaders() });
                    setPayments(data);
                  } catch {
                    setMessage('Failed to submit payment.');
                  } finally {
                    setPaySaving(false);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
                    <input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Mobile Money">Mobile Money</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                    <input type="date" value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proof of Payment (optional)</label>
                    <input type="file" accept="image/*,application/pdf" onChange={e => setPayFile(e.target.files?.[0] || null)} className="text-sm" />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => { setShowPayForm(false); setPayFile(null); }} className="btn btn-secondary">Cancel</button>
                    <button type="submit" disabled={paySaving} className="btn btn-primary disabled:opacity-50">{paySaving ? 'Submitting...' : 'Submit Payment'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {payments.length === 0 ? (
            <p className="text-gray-500 text-sm">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-gray-500">Date</th>
                    <th className="text-left py-2 pr-4 font-medium text-gray-500">Amount</th>
                    <th className="text-left py-2 pr-4 font-medium text-gray-500">Method</th>
                    <th className="text-left py-2 pr-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-2 font-medium text-gray-500">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} className="border-b">
                      <td className="py-2 pr-4">{p.payment_date}</td>
                      <td className="py-2 pr-4 font-medium">₦{Number(p.amount).toLocaleString()}</td>
                      <td className="py-2 pr-4">{p.payment_method}</td>
                      <td className="py-2 pr-4">
                        <span className={`badge ${
                          p.status === 'approved' ? 'badge-success' :
                          p.status === 'rejected' ? 'badge-danger' :
                          'badge-warning'
                        }`}>{p.status}</span>
                      </td>
                      <td className="py-2">
                        {p.proof_url ? (
                          <a href={p.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline text-xs">View</a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
