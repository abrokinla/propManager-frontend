'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import type { TenantSelf, TenancyDocument, TenantProfile } from '../../../types';

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
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState<TenantProfile>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const token = getTenantToken();
      if (!token) {
        router.push('/tenant/login');
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      const [meRes, docsRes] = await Promise.all([
        axios.get<TenantSelf>(`${API_URL}/tenant/me/`, { headers }),
        axios.get<TenancyDocument[]>(`${API_URL}/tenant/me/documents/`, { headers }),
      ]);
      setTenant(meRes.data);
      setDocuments(docsRes.data);
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
      await axios.post(`${API_URL}/tenant/me/documents/${docId}/sign/`, {}, { headers: getAuthHeaders() });
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
      </main>
    </div>
  );
}
