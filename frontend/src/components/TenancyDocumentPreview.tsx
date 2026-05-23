'use client';

import type { Tenant } from '../types';

interface TenancyDocumentPreviewProps {
  tenant: Tenant;
}

export default function TenancyDocumentPreview({ tenant }: TenancyDocumentPreviewProps) {
  return (
    <div className="space-y-4 text-sm">
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Tenant</p>
        <p className="font-semibold">{tenant.name}</p>
        <p className="text-gray-600">{tenant.email} · {tenant.phone}</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Property</p>
        <p className="font-semibold">{tenant.unit?.property_name || tenant.property_name || '—'}</p>
        <p className="text-gray-600">Unit {tenant.unit?.unit_number || tenant.unit_number || '—'}</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Lease Terms</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-500">Annual Rent</p>
            <p className="font-semibold">{tenant.annual_rent ? `₦${Number(tenant.annual_rent).toLocaleString()}` : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Start Date</p>
            <p className="font-semibold">{tenant.lease_start_date || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Expiry Date</p>
            <p className="font-semibold">{tenant.lease_expiry_date || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Duration</p>
            <p className="font-semibold">1 year</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-700">
          The tenancy agreement will be generated as a PDF document and sent to {tenant.email}.
          The tenant will need to print, sign, scan, and return the document.
        </p>
      </div>
    </div>
  );
}
