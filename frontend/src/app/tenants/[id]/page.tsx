'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';
import ErrorBoundary from '../../../components/ErrorBoundary';
import ConfirmDialog from '../../../components/ConfirmDialog';
import TenantDocumentList from '../../../components/TenantDocumentList';
import TenancyDocumentPreview from '../../../components/TenancyDocumentPreview';
import IssueQuitNoticeModal from '../../../components/IssueQuitNoticeModal';
import UploadSignedDocumentModal from '../../../components/UploadSignedDocumentModal';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import type {
  Tenant, Unit, Payment, PaginatedResponse,
  TenancyDocument, Reminder, QuitNotice, TenancyStatus,
} from '../../../types';

const tenancyStatusConfig: Record<TenancyStatus, { label: string; className: string }> = {
  pending_document: { label: 'Pending Document', className: 'badge-warning' },
  document_sent: { label: 'Document Sent', className: 'badge-info' },
  document_signed: { label: 'Document Signed', className: 'badge-info' },
  active: { label: 'Active', className: 'badge-success' },
  expired: { label: 'Expired', className: 'badge-danger' },
  quit_notice_issued: { label: 'Quit Notice', className: 'badge-danger' },
};

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tenantId = Number(params.id);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [documents, setDocuments] = useState<TenancyDocument[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [quitNotices, setQuitNotices] = useState<QuitNotice[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [editForm, setEditForm] = useState({
    unit_id: '', name: '', phone: '', email: '', address: '',
    annual_rent: '', tenancy_status: 'pending_document' as TenancyStatus,
    lease_start_date: '', lease_renewal_date: '', lease_expiry_date: '',
    move_in_date: '', is_active: 'true',
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSendDocument, setShowSendDocument] = useState(false);
  const [showUploadSigned, setShowUploadSigned] = useState<TenancyDocument | null>(null);
  const [showQuitNotice, setShowQuitNotice] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [sendingDocument, setSendingDocument] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);

  const fetchTenant = async () => {
    try {
      const [tRes, pRes, uRes] = await Promise.all([
        api.get<Tenant>(`/tenants/${tenantId}/`),
        api.get<PaginatedResponse<Payment>>(`/payments/?tenant=${tenantId}`),
        api.get<PaginatedResponse<Unit>>('/units/'),
      ]);
      setTenant(tRes.data);
      setPayments(pRes.data.results);
      setUnits(uRes.data.results);
    } catch {
      toast('Failed to load tenant data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data } = await api.get<TenancyDocument[]>(`/tenants/${tenantId}/documents/`);
      setDocuments(data);
    } catch {
      // documents endpoint may not exist yet
    }
  };

  const fetchReminders = async () => {
    try {
      const { data } = await api.get<Reminder[]>(`/tenants/${tenantId}/reminders/`);
      setReminders(data);
    } catch {
      // reminders endpoint may not exist yet
    }
  };

  const fetchQuitNotices = async () => {
    try {
      const { data } = await api.get<QuitNotice[]>(`/tenants/${tenantId}/quit-notices/`);
      setQuitNotices(data);
    } catch {
      // quit-notices endpoint may not exist yet
    }
  };

  useEffect(() => {
    fetchTenant();
    fetchDocuments();
    fetchReminders();
    fetchQuitNotices();
  }, [tenantId]);

  const handleSendDocument = async () => {
    setSendingDocument(true);
    try {
      const document_data = tenant ? {
        parties: {
          tenant: { name: tenant.name, email: tenant.email, phone: tenant.phone },
        },
        property: {
          name: tenant.unit?.property_name || tenant.property_name || '',
          unit: tenant.unit?.unit_number || tenant.unit_number || '',
        },
        financial_terms: {
          annual_rent: tenant.annual_rent ? Number(tenant.annual_rent) : null,
        },
        term: {
          start_date: tenant.lease_start_date || '',
          expiry_date: tenant.lease_expiry_date || '',
          duration: '1 year',
        },
      } : {};
      await api.post(`/tenants/${tenantId}/send-document/`, {
        document_data,
        upload_base_url: window.location.origin,
      });
      toast('Tenancy agreement sent to tenant', 'success');
      setShowSendDocument(false);
      fetchTenant();
      fetchDocuments();
    } catch {
      toast('Failed to send document', 'error');
    } finally {
      setSendingDocument(false);
    }
  };

  const handleSendReminder = async (channel: 'email') => {
    setSendingReminder(true);
    try {
      await api.post(`/tenants/${tenantId}/send-reminder/`, { channel, reminder_type: 'lease_expiry' });
      toast(`Reminder sent via ${channel}`, 'success');
      fetchReminders();
    } catch {
      toast('Failed to send reminder', 'error');
    } finally {
      setSendingReminder(false);
    }
  };

  const handleEdit = () => {
    if (!tenant) return;
    setEditing(tenant);
    setEditForm({
      unit_id: String(tenant.unit?.id || tenant.unit_id || ''),
      name: tenant.name, phone: tenant.phone, email: tenant.email, address: tenant.address || '',
      annual_rent: tenant.annual_rent ? String(tenant.annual_rent) : '',
      tenancy_status: tenant.tenancy_status,
      lease_start_date: tenant.lease_start_date || '', lease_renewal_date: tenant.lease_renewal_date || '',
      lease_expiry_date: tenant.lease_expiry_date || '', move_in_date: tenant.move_in_date || '',
      is_active: String(tenant.is_active),
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormErrors({});
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        unit_id: Number(editForm.unit_id),
        annual_rent: editForm.annual_rent || null,
        is_active: editForm.is_active === 'true',
      };
      await api.put(`/tenants/${tenantId}/`, payload);
      toast('Tenant updated successfully', 'success');
      setShowEditForm(false);
      setEditing(null);
      fetchTenant();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: Record<string, string[] | string> } };
      const data = axiosError.response?.data;
      if (data) {
        const fe: Record<string, string> = {};
        for (const [k, v] of Object.entries(data)) fe[k] = Array.isArray(v) ? v[0] : v;
        setEditFormErrors(fe);
      } else {
        toast('Failed to update tenant', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
    if (editFormErrors[e.target.name]) setEditFormErrors({ ...editFormErrors, [e.target.name]: '' });
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/tenants/${tenantId}/`);
      toast('Tenant deleted successfully', 'success');
      router.push('/tenants');
    } catch {
      toast('Failed to delete tenant', 'error');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!tenant) {
    return (
      <DashboardLayout>
        <div className="card text-center py-12">
          <h2 className="text-lg font-semibold mb-2">Tenant not found</h2>
          <Link href="/tenants" className="btn btn-primary">Back to Tenants</Link>
        </div>
      </DashboardLayout>
    );
  }

  const statusCfg = tenancyStatusConfig[tenant.tenancy_status] || tenancyStatusConfig.active;
  const activeQuitNotice = quitNotices.find(q => q.status === 'issued' || q.status === 'acknowledged');

  return (
    <ErrorBoundary>
    <DashboardLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/tenants" className="hover:text-primary-600">Tenants</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{tenant.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <span className={`badge ${statusCfg.className}`}>{statusCfg.label}</span>
          </div>
          <p className="text-gray-500">
            {tenant.unit?.property_name || tenant.property_name || '—'} · Unit {tenant.unit?.unit_number || tenant.unit_number || '—'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleEdit} className="btn btn-secondary">Edit</button>
          <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-danger">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Lease Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lease Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Lease Information</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Annual Rent</p>
                <p className="text-lg font-bold text-primary-600">
                  {tenant.annual_rent ? `₦${Number(tenant.annual_rent).toLocaleString()}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Lease Start</p>
                <p className="text-sm font-medium">{tenant.lease_start_date || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Lease Expiry</p>
                <p className="text-sm font-medium">{tenant.lease_expiry_date || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Lease Renewal</p>
                <p className="text-sm">{tenant.lease_renewal_date || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Move-in Date</p>
                <p className="text-sm">{tenant.move_in_date || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Active</p>
                <p className="text-sm">{tenant.is_active ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Email</p>
                <p className="text-sm">{tenant.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Phone</p>
                <p className="text-sm">{tenant.phone || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 font-medium uppercase">Address</p>
                <p className="text-sm">{tenant.address || '—'}</p>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Payment History</h2>
              <Link href={`/payments?tenant=${tenantId}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Record Payment
              </Link>
            </div>
            {payments.length === 0 ? (
              <p className="text-gray-500 text-sm">No payments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Amount</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Period</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Date</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Method</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-b border-gray-50">
                        <td className="py-2 px-3 font-semibold text-green-600">₦{Number(p.amount).toLocaleString()}</td>
                        <td className="py-2 px-3 text-gray-600">{p.period_start} — {p.period_end}</td>
                        <td className="py-2 px-3 text-gray-600">{p.payment_date}</td>
                        <td className="py-2 px-3">{p.payment_method}</td>
                        <td className="py-2 px-3 text-gray-500 text-xs">{p.reference || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Documents, Reminders, Quit Notice */}
        <div className="space-y-6">
          {/* Tenancy Documents */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Documents</h2>
            <TenantDocumentList
              documents={documents}
              onSendDocument={() => setShowSendDocument(true)}
              onUploadSigned={(doc) => setShowUploadSigned(doc)}
              tenantStatus={tenant.tenancy_status}
            />
          </div>

          {/* Reminders */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Reminders</h2>
            {reminders.length === 0 ? (
              <p className="text-gray-500 text-sm mb-4">No reminders sent yet.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {reminders.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-50">
                    <div>
                      <p className="text-xs text-gray-500">{r.reminder_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-400">{r.sent_at ? new Date(r.sent_at).toLocaleDateString() : ''}</p>
                    </div>
                    <span className={`text-xs font-medium ${r.delivery_status === 'delivered' ? 'text-green-600' : r.delivery_status === 'failed' ? 'text-red-600' : 'text-gray-500'}`}>
                      {r.delivery_status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => handleSendReminder('email')}
              disabled={sendingReminder}
              className="btn btn-secondary w-full text-sm disabled:opacity-50"
            >
              {sendingReminder ? 'Sending...' : 'Send Lease Reminder'}
            </button>
          </div>

          {/* Quit Notice */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Quit Notice</h2>
            {activeQuitNotice ? (
              <div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-red-700">Quit Notice Issued</p>
                  <p className="text-xs text-red-600 mt-1">Effective: {activeQuitNotice.effective_date}</p>
                  {activeQuitNotice.document_url && (
                    <a
                      href={activeQuitNotice.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block"
                    >
                      Download Notice
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-4">No quit notice issued.</p>
            )}
            <button
              onClick={() => setShowQuitNotice(true)}
              className="btn btn-danger w-full text-sm"
              disabled={!!activeQuitNotice}
            >
              {activeQuitNotice ? 'Quit Notice Active' : 'Issue Quit Notice'}
            </button>
          </div>
        </div>
      </div>

      {/* Send Document Modal */}
      {showSendDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Send Tenancy Agreement</h2>
            <TenancyDocumentPreview tenant={tenant} />
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowSendDocument(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSendDocument} disabled={sendingDocument} className="btn btn-primary disabled:opacity-50">
                {sendingDocument ? 'Sending...' : 'Send to Tenant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Edit Tenant</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <select name="unit_id" value={editForm.unit_id} onChange={handleEditChange} required>
                  <option value="">Select unit...</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.property?.name || u.property_name} - {u.unit_number}</option>)}
                </select>
                {editFormErrors.unit_id && <p className="text-red-500 text-xs mt-1">{editFormErrors.unit_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input name="name" value={editForm.name} onChange={handleEditChange} required />
                {editFormErrors.name && <p className="text-red-500 text-xs mt-1">{editFormErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input name="phone" value={editForm.phone} onChange={handleEditChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input name="email" type="email" value={editForm.email} onChange={handleEditChange} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input name="address" value={editForm.address} onChange={handleEditChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Rent (₦)</label>
                  <input name="annual_rent" type="number" value={editForm.annual_rent} onChange={handleEditChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
                  <select name="is_active" value={editForm.is_active} onChange={handleEditChange}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease Start</label>
                  <input name="lease_start_date" type="date" value={editForm.lease_start_date} onChange={handleEditChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease Expiry</label>
                  <input name="lease_expiry_date" type="date" value={editForm.lease_expiry_date} onChange={handleEditChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease Renewal</label>
                  <input name="lease_renewal_date" type="date" value={editForm.lease_renewal_date} onChange={handleEditChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Move-in Date</label>
                  <input name="move_in_date" type="date" value={editForm.move_in_date} onChange={handleEditChange} />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowEditForm(false); setEditing(null); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Tenant"
        message={`Are you sure you want to delete "${tenant.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Upload Signed Document Modal */}
      {showUploadSigned && (
        <UploadSignedDocumentModal
          document={showUploadSigned}
          onClose={() => setShowUploadSigned(null)}
          onUploaded={() => { fetchDocuments(); fetchTenant(); }}
        />
      )}

      {/* Issue Quit Notice Modal */}
      {showQuitNotice && (
        <IssueQuitNoticeModal
          tenant={tenant}
          onClose={() => setShowQuitNotice(false)}
          onIssued={() => { fetchQuitNotices(); fetchTenant(); }}
        />
      )}
    </DashboardLayout>
    </ErrorBoundary>
  );
}
