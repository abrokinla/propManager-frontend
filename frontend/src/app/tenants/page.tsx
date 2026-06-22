'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import ErrorBoundary from '../../components/ErrorBoundary';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { Unit, Tenant, Property, PaginatedResponse, TenancyStatus } from '../../types';

const tenancyStatusConfig: Record<string, { label: string; className: string }> = {
  invited: { label: 'Invited', className: 'badge-warning' },
  profile_pending: { label: 'Profile Pending', className: 'badge-warning' },
  document_pending: { label: 'Document Pending', className: 'badge-info' },
  pending_document: { label: 'Pending Document', className: 'badge-warning' },
  document_sent: { label: 'Document Sent', className: 'badge-info' },
  document_signed: { label: 'Document Signed', className: 'badge-info' },
  pending_verification: { label: 'Pending Verification', className: 'badge-warning' },
  active: { label: 'Active', className: 'badge-success' },
  expired: { label: 'Expired', className: 'badge-danger' },
  quit_notice_issued: { label: 'Quit Notice', className: 'badge-danger' },
};

const defaultForm = {
  property_id: '', unit_id: '', name: '', phone: '', email: '', address: '',
  annual_rent: '', tenancy_status: 'invited' as TenancyStatus,
  lease_start_date: '', lease_renewal_date: '', lease_expiry_date: '',
  move_in_date: '', is_active: 'true',
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [sendingInvite, setSendingInvite] = useState<number | null>(null);
  const [pendingVerifications, setPendingVerifications] = useState<Record<number, { document_id: number; signed_file_url: string; tenant_name: string }>>({});
  const [verifyTarget, setVerifyTarget] = useState<{ tenantId: number; tenantName: string; docId: number; signedUrl: string } | null>(null);
  const [verifyAction, setVerifyAction] = useState<'verify' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      api.get<PaginatedResponse<Tenant>>('/tenants/'),
      api.get<PaginatedResponse<Unit>>('/units/'),
      api.get<PaginatedResponse<Property>>('/properties/'),
      api.get<{ tenant_id: number; tenant_name: string; document_id: number; signed_file_url: string }[]>('/pending-verifications/').catch(() => ({ data: [] })),
    ]).then(([tRes, uRes, pRes, vRes]) => {
      setTenants(tRes.data.results);
      setUnits(uRes.data.results);
      setProperties(pRes.data.results);
      const vMap: Record<number, { document_id: number; signed_file_url: string; tenant_name: string }> = {};
      for (const v of vRes.data) {
        vMap[v.tenant_id] = { document_id: v.document_id, signed_file_url: v.signed_file_url, tenant_name: v.tenant_name };
      }
      setPendingVerifications(vMap);
    }).catch(() => toast('Failed to load data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const unitMap = new Map(units.map(u => [u.id, u]));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updates: Record<string, string> = { [name]: value };
      if (name === 'property_id') updates.unit_id = '';
      if (name === 'lease_start_date') updates.move_in_date = value;
      if (name === 'lease_expiry_date') updates.lease_renewal_date = value;
      return { ...prev, ...updates };
    });
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSaving(true);
    try {
      const payload = {
        ...form,
        unit_id: Number(form.unit_id),
        annual_rent: form.annual_rent || null,
        is_active: form.is_active === 'true',
      };
      if (editing) {
        await api.put(`/tenants/${editing.id}/`, payload);
        toast('Tenant updated successfully', 'success');
      } else {
        await api.post('/tenants/', payload);
        toast('Tenant created. Invitation sent to ' + (payload.email || 'their email'), 'success');
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultForm);
      const { data } = await api.get<PaginatedResponse<Tenant>>('/tenants/');
      setTenants(data.results);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: Record<string, string[] | string> } };
      const data = axiosError.response?.data;
      if (data) {
        const fe: Record<string, string> = {};
        for (const [k, v] of Object.entries(data)) fe[k] = Array.isArray(v) ? v[0] : v;
        setFormErrors(fe);
      } else {
        toast('Failed to save tenant', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (t: Tenant) => {
    const unitId = t.unit?.id || t.unit_id;
    const unit = units.find(u => u.id === unitId);
    setEditing(t);
    setForm({
      property_id: unit?.property_id ? String(unit.property_id) : '',
      unit_id: String(unitId || ''),
      name: t.name, phone: t.phone, email: t.email, address: t.address || '',
      annual_rent: t.annual_rent ? String(t.annual_rent) : '',
      tenancy_status: t.tenancy_status,
      lease_start_date: t.lease_start_date || '', lease_renewal_date: t.lease_renewal_date || '',
      lease_expiry_date: t.lease_expiry_date || '', move_in_date: t.move_in_date || '',
      is_active: String(t.is_active),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/tenants/${id}/`);
      toast('Tenant removed successfully', 'success');
      setTenants(tenants.filter(t => t.id !== id));
    } catch {
      toast('Failed to remove tenant', 'error');
    }
  };

  const handleResendInvite = async (tenantId: number) => {
    setSendingInvite(tenantId);
    try {
      await api.post(`/tenants/${tenantId}/resend-invite/`);
      toast('Invitation resent successfully', 'success');
    } catch {
      toast('Failed to resend invitation', 'error');
    } finally {
      setSendingInvite(null);
    }
  };

  const canResend = (status: TenancyStatus) => status === 'invited' || status === 'profile_pending';

  const propertyTenants = selectedProperty
    ? tenants.filter(t => {
        const uid = t.unit?.id ?? t.unit_id;
        return uid ? (unitMap.get(uid)?.property_id === selectedProperty) : false;
      })
    : [];

  const propertyUnits = selectedProperty
    ? units.filter(u => u.property_id === selectedProperty)
    : [];

  const occupiedUnitIds = new Set(
    propertyTenants.map(t => t.unit?.id ?? t.unit_id).filter(Boolean) as number[]
  );

  const availableUnits = propertyUnits.filter(u => !occupiedUnitIds.has(u.id));
  const selectedPropData = selectedProperty
    ? properties.find(p => p.id === selectedProperty)
    : null;

  const tenantCountsByProperty = new Map<number, number>();
  tenants.forEach(t => {
    const uid = t.unit?.id ?? t.unit_id;
    const u = uid ? unitMap.get(uid) : undefined;
    if (u?.property_id) {
      tenantCountsByProperty.set(u.property_id, (tenantCountsByProperty.get(u.property_id) ?? 0) + 1);
    }
  });

  if (loading) {
    return (
      <ErrorBoundary>
      <DashboardLayout>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <DashboardLayout>
      {!selectedProperty ? (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Tenants</h1>
              <p className="mt-1" style={{ color: 'var(--text-light)' }}>
                {tenants.length} tenant{tenants.length === 1 ? '' : 's'} across {properties.length} {properties.length === 1 ? 'property' : 'properties'}
              </p>
            </div>
          </div>

          {properties.length === 0 ? (
            <div className="card text-center py-12">
              <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>No properties yet</h3>
              <p className="mb-4" style={{ color: 'var(--text-light)' }}>Create a property first before adding tenants.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map(prop => {
                const count = tenantCountsByProperty.get(prop.id) ?? 0;
                const total = prop.total_units ?? units.filter(u => u.property_id === prop.id).length;
                return (
                  <button
                    key={prop.id}
                    onClick={() => setSelectedProperty(prop.id)}
                    className="card text-left hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="w-full h-40 rounded-lg overflow-hidden mb-4" style={{ backgroundColor: 'var(--bg)' }}>
                      {prop.image_url ? (
                        <img src={prop.image_url} alt={prop.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12" style={{ color: 'var(--text-light)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-base" style={{ color: 'var(--text)' }}>{prop.name}</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>{prop.address}</p>
                    <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-light)' }}>
                      {count} tenant{count === 1 ? '' : 's'} / {total} unit{total === 1 ? '' : 's'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedProperty(null)}
                className="btn btn-secondary"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Properties
              </button>
            </div>
          </div>

          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{selectedPropData?.name || 'Property'}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>{selectedPropData?.address}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>
                  {propertyTenants.length} of {propertyUnits.length} unit{propertyUnits.length === 1 ? '' : 's'} occupied
                </p>
              </div>
              {availableUnits.length > 0 && (
                <button
                  onClick={() => {
                    setEditing(null);
                    setForm({ ...defaultForm, property_id: String(selectedProperty) });
                    setShowForm(true);
                  }}
                  className="btn btn-primary"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Tenant
                </button>
              )}
            </div>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>{editing ? 'Edit Tenant' : 'Add New Tenant'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Property *</label>
                    {editing || !selectedProperty ? (
                      <select name="property_id" value={form.property_id} onChange={handleChange} required>
                        <option value="">Select property...</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    ) : (
                      <select name="property_id" value={form.property_id} disabled className="w-full opacity-60 cursor-not-allowed">
                        <option value="">Select property...</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Unit *</label>
                    {editing ? (
                      <select name="unit_id" value={form.unit_id} onChange={handleChange} required>
                        <option value="">Select unit...</option>
                        {(form.property_id ? units.filter(u => u.property_id === Number(form.property_id)) : [])
                          .map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)
                        }
                      </select>
                    ) : (
                      <select name="unit_id" value={form.unit_id} onChange={handleChange} required>
                        <option value="">{form.property_id ? 'Select unit...' : 'Select a property first'}</option>
                        {(form.property_id ? units
                          .filter(u => u.property_id === Number(form.property_id))
                          .filter(u => editing || !occupiedUnitIds.has(u.id) || u.id === Number(form.unit_id))
                          : [])
                          .map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)
                        }
                      </select>
                    )}
                    {formErrors.unit_id && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{formErrors.unit_id}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Full Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
                    {formErrors.name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{formErrors.name}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Phone</label>
                      <input name="phone" value={form.phone} onChange={handleChange} placeholder="+234..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Email</label>
                      <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Address</label>
                    <input name="address" value={form.address} onChange={handleChange} placeholder="Home address" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Annual Rent (₦)</label>
                      <input name="annual_rent" type="number" value={form.annual_rent} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Active</label>
                      <select name="is_active" value={form.is_active} onChange={handleChange}>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Lease Start</label>
                      <input name="lease_start_date" type="date" value={form.lease_start_date} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Lease Expiry</label>
                      <input name="lease_expiry_date" type="date" value={form.lease_expiry_date} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Lease Renewal</label>
                      <input name="lease_renewal_date" type="date" value={form.lease_renewal_date} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Move-in Date</label>
                      <input name="move_in_date" type="date" value={form.move_in_date} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => { setShowForm(false); setEditing(null); setFormErrors({}); setForm(defaultForm); }} className="btn btn-secondary">Cancel</button>
                    <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create Tenant'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {propertyTenants.length === 0 ? (
            <div className="card text-center py-12">
              <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>No tenants yet</h3>
              <p className="mb-4" style={{ color: 'var(--text-light)' }}>
                {availableUnits.length > 0
                  ? `There ${availableUnits.length === 1 ? 'is' : 'are'} ${availableUnits.length} available unit${availableUnits.length === 1 ? '' : 's'} in this property.`
                  : 'All units in this property are occupied.'}
              </p>
              {availableUnits.length > 0 && (
                <button
                  onClick={() => {
                    setEditing(null);
                    setForm({ ...defaultForm, property_id: String(selectedProperty) });
                    setShowForm(true);
                  }}
                  className="btn btn-primary"
                >
                  Add Tenant
                </button>
              )}
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Name</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Unit</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Annual Rent</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Lease Expiry</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Status</th>
                    <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyTenants.map((t) => {
                    const statusCfg = tenancyStatusConfig[t.tenancy_status] || tenancyStatusConfig.active;
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-3 px-4">
                          <Link href={`/tenants/${t.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                            {t.name}
                          </Link>
                          <div className="text-xs" style={{ color: 'var(--text-light)' }}>{t.email}</div>
                        </td>
                        <td className="py-3 px-4" style={{ color: 'var(--text-light)' }}>{t.unit?.unit_number || t.unit_number || '—'}</td>
                        <td className="py-3 px-4" style={{ color: 'var(--text)' }}>{t.annual_rent ? `₦${Number(t.annual_rent).toLocaleString()}/yr` : '—'}</td>
                        <td className="py-3 px-4" style={{ color: 'var(--text-light)' }}>{t.lease_expiry_date || '—'}</td>
                        <td className="py-3 px-4"><span className={`badge ${statusCfg.className}`}>{statusCfg.label}</span></td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button onClick={() => handleEdit(t)} className="text-primary-600 hover:text-primary-700 text-sm font-medium mr-3">Edit</button>
                          {canResend(t.tenancy_status) && (
                            <button
                              onClick={() => handleResendInvite(t.id)}
                              disabled={sendingInvite === t.id}
                              className="text-sm font-medium mr-3 disabled:opacity-50"
                              style={{ color: 'var(--success)' }}
                            >
                              {sendingInvite === t.id ? 'Sending...' : 'Resend Invite'}
                            </button>
                          )}
                          {pendingVerifications[t.id] && (
                            <button
                              onClick={() => setVerifyTarget({
                                tenantId: t.id,
                                tenantName: t.name,
                                docId: pendingVerifications[t.id].document_id,
                                signedUrl: pendingVerifications[t.id].signed_file_url,
                              })}
                              className="text-sm font-medium mr-3"
                              style={{ color: '#a16207' }}
                            >
                              Review
                            </button>
                          )}
                          <button onClick={() => setDeleteTarget(t.id)} className="text-sm font-medium" style={{ color: 'var(--danger)' }}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <ConfirmDialog
            open={!!deleteTarget}
            title="Delete Tenant"
            message="Are you sure you want to remove this tenant? The associated unit will become available."
            onConfirm={() => {
              const id = deleteTarget!;
              setDeleteTarget(null);
              return handleDelete(id);
            }}
            onCancel={() => setDeleteTarget(null)}
          />

          {verifyTarget && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="card w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Verify Signed Agreement</h2>
                <p className="text-sm mb-1" style={{ color: 'var(--text)' }}><b>Tenant:</b> {verifyTarget.tenantName}</p>
                <div className="mb-4">
                  <a href={verifyTarget.signedUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline text-sm">View signed document</a>
                </div>

                {!verifyAction ? (
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setVerifyTarget(null)} className="btn btn-secondary">Cancel</button>
                    <button onClick={() => setVerifyAction('reject')} className="btn btn-danger" style={{ backgroundColor: 'var(--danger)' }}>Reject</button>
                    <button
                      onClick={async () => {
                        setVerifying(true);
                        try {
                          await api.post(`/tenants/${verifyTarget.tenantId}/documents/${verifyTarget.docId}/verify/`, { action: 'verify' });
                          toast('Agreement verified as signed', 'success');
                          setVerifyTarget(null);
                          setVerifyAction(null);
                          const { data: vRes } = await api.get('/pending-verifications/').catch(() => ({ data: [] }));
                          const vMap: Record<number, { document_id: number; signed_file_url: string; tenant_name: string }> = {};
                          for (const v of (vRes as any).data || vRes) {
                            vMap[v.tenant_id] = { document_id: v.document_id, signed_file_url: v.signed_file_url, tenant_name: v.tenant_name };
                          }
                          setPendingVerifications(vMap);
                        } catch {
                          toast('Failed to verify', 'error');
                        } finally {
                          setVerifying(false);
                        }
                      }}
                      disabled={verifying}
                      className="btn btn-primary disabled:opacity-50"
                    >
                      {verifying ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Rejection Reason</p>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      className="w-full"
                      rows={3}
                      placeholder="Explain why the signed document was not accepted..."
                    />
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => { setVerifyAction(null); setRejectReason(''); }} className="btn btn-secondary">Back</button>
                      <button
                        onClick={async () => {
                          if (!rejectReason.trim()) { toast('Please provide a reason', 'error'); return; }
                          setVerifying(true);
                          try {
                            await api.post(`/tenants/${verifyTarget.tenantId}/documents/${verifyTarget.docId}/verify/`, { action: 'reject', reason: rejectReason });
                            toast('Agreement rejected', 'success');
                            setVerifyTarget(null);
                            setVerifyAction(null);
                            setRejectReason('');
                            const { data: vRes } = await api.get('/pending-verifications/').catch(() => ({ data: [] }));
                            const vMap: Record<number, { document_id: number; signed_file_url: string; tenant_name: string }> = {};
                            for (const v of (vRes as any).data || vRes) {
                              vMap[v.tenant_id] = { document_id: v.document_id, signed_file_url: v.signed_file_url, tenant_name: v.tenant_name };
                            }
                            setPendingVerifications(vMap);
                          } catch {
                            toast('Failed to reject', 'error');
                          } finally {
                            setVerifying(false);
                          }
                        }}
                        disabled={verifying}
                        className="btn btn-primary disabled:opacity-50"
                        style={{ backgroundColor: 'var(--danger)' }}
                      >
                        {verifying ? 'Rejecting...' : 'Confirm Reject'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
    </ErrorBoundary>
  );
}
