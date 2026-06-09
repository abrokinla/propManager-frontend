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
  Tenant, Unit, Property, Payment, PaginatedResponse,
  TenancyDocument, Reminder, QuitNotice, TenancyStatus,
} from '../../../types';

const tenancyStatusConfig: Record<TenancyStatus, { label: string; className: string }> = {
  invited: { label: 'Invited', className: 'badge-warning' },
  profile_pending: { label: 'Profile Pending', className: 'badge-warning' },
  document_pending: { label: 'Document Pending', className: 'badge-info' },
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
    property_id: '', unit_id: '', name: '', phone: '', email: '', address: '',
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
  const [properties, setProperties] = useState<Property[]>([]);

  const fetchTenant = async () => {
    try {
      const [tRes, pRes, uRes, propRes] = await Promise.all([
        api.get<Tenant>(`/tenants/${tenantId}/`),
        api.get<PaginatedResponse<Payment>>(`/payments/?tenant=${tenantId}`),
        api.get<PaginatedResponse<Unit>>('/units/'),
        api.get<PaginatedResponse<Property>>('/properties/'),
      ]);
      setTenant(tRes.data);
      setPayments(pRes.data.results);
      setUnits(uRes.data.results);
      setProperties(propRes.data.results);
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
    const unitId = tenant.unit?.id || tenant.unit_id;
    const unit = units.find(u => u.id === unitId);
    setEditing(tenant);
    setEditForm({
      property_id: unit?.property_id ? String(unit.property_id) : '',
      unit_id: String(unitId || ''),
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
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value, ...(name === 'property_id' ? { unit_id: '' } : {}) }));
    if (editFormErrors[name]) setEditFormErrors(prev => ({ ...prev, [name]: '' }));
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
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Tenant not found</h2>
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
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--text-light)' }}>
        <Link href="/tenants" className="hover:text-primary-600">Tenants</Link>
        <span>/</span>
        <span className="font-medium" style={{ color: 'var(--text)' }}>{tenant.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{tenant.name}</h1>
            <span className={`badge ${statusCfg.className}`}>{statusCfg.label}</span>
          </div>
          <p style={{ color: 'var(--text-light)' }}>
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
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Lease Information</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-light)' }}>Annual Rent</p>
                <p className="text-lg font-bold text-primary-600">
                  {tenant.annual_rent ? `₦${Number(tenant.annual_rent).toLocaleString()}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-light)' }}>Lease Start</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{tenant.lease_start_date || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-light)' }}>Lease Expiry</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{tenant.lease_expiry_date || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-light)' }}>Lease Renewal</p>
                <p className="text-sm" style={{ color: 'var(--text)' }}>{tenant.lease_renewal_date || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-light)' }}>Move-in Date</p>
                <p className="text-sm" style={{ color: 'var(--text)' }}>{tenant.move_in_date || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-light)' }}>Active</p>
                <p className="text-sm" style={{ color: 'var(--text)' }}>{tenant.is_active ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-light)' }}>Email</p>
                <p className="text-sm" style={{ color: 'var(--text)' }}>{tenant.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-light)' }}>Phone</p>
                <p className="text-sm" style={{ color: 'var(--text)' }}>{tenant.phone || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-light)' }}>Address</p>
                <p className="text-sm" style={{ color: 'var(--text)' }}>{tenant.address || '—'}</p>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Payment History</h2>
              <Link href={`/payments?tenant=${tenantId}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Record Payment
              </Link>
            </div>
            {payments.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-light)' }}>No payments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-light)' }}>Amount</th>
                      <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-light)' }}>Period</th>
                      <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-light)' }}>Date</th>
                      <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-light)' }}>Method</th>
                      <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-light)' }}>Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-2 px-3 font-semibold" style={{ color: 'var(--success)' }}>₦{Number(p.amount).toLocaleString()}</td>
                        <td className="py-2 px-3" style={{ color: 'var(--text-light)' }}>{p.period_start} — {p.period_end}</td>
                        <td className="py-2 px-3" style={{ color: 'var(--text-light)' }}>{p.payment_date}</td>
                        <td className="py-2 px-3" style={{ color: 'var(--text)' }}>{p.payment_method}</td>
                        <td className="py-2 px-3 text-xs" style={{ color: 'var(--text-light)' }}>{p.reference || '—'}</td>
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
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Documents</h2>
            <TenantDocumentList
              documents={documents}
              onSendDocument={() => setShowSendDocument(true)}
              onUploadSigned={(doc) => setShowUploadSigned(doc)}
              tenantStatus={tenant.tenancy_status}
            />
          </div>

          {/* Reminders */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Reminders</h2>
            {reminders.length === 0 ? (
              <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>No reminders sent yet.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {reminders.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-light)' }}>{r.reminder_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs" style={{ color: 'var(--text-light)' }}>{r.sent_at ? new Date(r.sent_at).toLocaleDateString() : ''}</p>
                    </div>
                    <span className={`text-xs font-medium ${r.delivery_status === 'delivered' ? '' : r.delivery_status === 'failed' ? '' : ''}`} style={{ color: r.delivery_status === 'delivered' ? 'var(--success)' : r.delivery_status === 'failed' ? 'var(--danger)' : 'var(--text-light)' }}>
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
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Quit Notice</h2>
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
              <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>No quit notice issued.</p>
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
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Send Tenancy Agreement</h2>
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
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Edit Tenant</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Property *</label>
                <select name="property_id" value={editForm.property_id} onChange={handleEditChange} required>
                  <option value="">Select property...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Unit *</label>
                <select name="unit_id" value={editForm.unit_id} onChange={handleEditChange} required>
                  <option value="">{editForm.property_id ? 'Select unit...' : 'Select a property first'}</option>
                  {editForm.property_id && units
                    .filter(u => u.property_id === Number(editForm.property_id))
                    .map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)
                  }
                </select>
                {editFormErrors.unit_id && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{editFormErrors.unit_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Full Name *</label>
                <input name="name" value={editForm.name} onChange={handleEditChange} required />
                {editFormErrors.name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{editFormErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Phone</label>
                  <input name="phone" value={editForm.phone} onChange={handleEditChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Email</label>
                  <input name="email" type="email" value={editForm.email} onChange={handleEditChange} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Address</label>
                <input name="address" value={editForm.address} onChange={handleEditChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Annual Rent (₦)</label>
                  <input name="annual_rent" type="number" value={editForm.annual_rent} onChange={handleEditChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Active</label>
                  <select name="is_active" value={editForm.is_active} onChange={handleEditChange}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Lease Start</label>
                  <input name="lease_start_date" type="date" value={editForm.lease_start_date} onChange={handleEditChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Lease Expiry</label>
                  <input name="lease_expiry_date" type="date" value={editForm.lease_expiry_date} onChange={handleEditChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Lease Renewal</label>
                  <input name="lease_renewal_date" type="date" value={editForm.lease_renewal_date} onChange={handleEditChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Move-in Date</label>
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
