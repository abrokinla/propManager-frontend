'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import DashboardLayout from '../../../../components/DashboardLayout';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import { Link } from '../../../../navigation';
import api from '../../../../lib/api';
import { useToast } from '../../../../context/ToastContext';
import type { Property, Unit } from '../../../../types';

export default function PropertyDetailPage() {
  const t = useTranslations('PropertyDetail');
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Property>(`/properties/${id}/`),
      api.get<{ results: Unit[] }>(`/units/?property_id=${id}`),
    ]).then(([propRes, unitsRes]) => {
      setProperty(propRes.data);
      setUnits(unitsRes.data.results || unitsRes.data as any);
    }).catch(() => {
      toast(t('loadFailed'), 'error');
    }).finally(() => setLoading(false));
  }, [id, t]);

  const handleDelete = async () => {
    try {
      await api.delete(`/properties/${id}/`);
      toast(t('deleted'), 'success');
      router.push('/properties');
    } catch {
      toast(t('deleteFailed'), 'error');
    }
  };

  const publicUrl = property?.public_slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/listings/${property.public_slug}`
    : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
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

  if (!property) {
    return (
      <DashboardLayout>
        <div className="card text-center py-12">
          <p style={{ color: 'var(--text)' }}>{t('notFound')}</p>
          <Link href="/properties" className="btn btn-primary mt-4">{t('backToProperties')}</Link>
        </div>
      </DashboardLayout>
    );
  }

  const occupiedCount = units.filter(u => u.status === 'Occupied').length;

  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="mb-6">
          <Link href="/properties" className="text-sm flex items-center gap-1" style={{ color: 'var(--primary)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {t('backToProperties')}
          </Link>
        </div>

        {/* Property Header */}
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          {/* Image */}
          <div className="lg:w-1/2">
            {property.image_url ? (
              <img src={property.image_url} alt={property.name} className="w-full h-72 object-cover rounded-xl" />
            ) : (
              <div className="w-full h-72 rounded-xl flex items-center justify-center" style={{ background: 'var(--hover-bg)' }}>
                <svg className="w-16 h-16" style={{ color: 'var(--text-light)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-info">{property.property_type}</span>
              {property.is_published && <span className="badge badge-success">{t('published')}</span>}
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>{property.name}</h1>
            <p className="flex items-center gap-1 mb-4" style={{ color: 'var(--text-light)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {property.address}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="card text-center py-3">
                <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{property.total_units ?? property.units_count}</p>
                <p className="text-xs" style={{ color: 'var(--text-light)' }}>{t('totalUnits')}</p>
              </div>
              <div className="card text-center py-3">
                <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>{occupiedCount}</p>
                <p className="text-xs" style={{ color: 'var(--text-light)' }}>{t('occupied')}</p>
              </div>
              <div className="card text-center py-3">
                <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{(property.total_units ?? property.units_count) - occupiedCount}</p>
                <p className="text-xs" style={{ color: 'var(--text-light)' }}>{t('vacant')}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link href="/units" className="btn btn-primary flex-1 text-center">{t('manageUnits')}</Link>
              <button onClick={() => router.push(`/properties`)} className="btn btn-secondary flex-1">{t('editProperty')}</button>
              <button onClick={() => setDeleteTarget(true)} className="btn btn-danger">{t('deleteProperty')}</button>
            </div>
          </div>
        </div>

        {/* Description & Details */}
        {(property.description || property.amenities || property.nearby_places) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {property.description && (
              <div className="card">
                <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>{t('aboutProperty')}</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-light)' }}>{property.description}</p>
              </div>
            )}
            {property.amenities && (
              <div className="card">
                <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>{t('amenities')}</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.split(',').map((a, i) => (
                    <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium">{a.trim()}</span>
                  ))}
                </div>
              </div>
            )}
            {property.nearby_places && (
              <div className="card">
                <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>{t('nearbyPlaces')}</h2>
                <div className="flex flex-wrap gap-2">
                  {property.nearby_places.split(',').map((p, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">{p.trim()}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Public Share Link */}
        {property.is_published && property.public_slug && (
          <div className="card mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--hover-bg)' }}>
                <svg className="w-5 h-5" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              </div>
              <div>
                <h2 className="font-semibold" style={{ color: 'var(--text)' }}>{t('shareLink')}</h2>
                <p className="text-sm" style={{ color: 'var(--text-light)' }}>{t('shareLinkDescription')}</p>
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                readOnly
                value={publicUrl}
                className="flex-1 text-sm px-3 py-2 border rounded-lg"
                style={{ borderColor: 'var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <button onClick={copyLink} className="btn btn-primary text-sm shrink-0">
                {copied ? t('copied') : t('copyLink')}
              </button>
            </div>
            {/* Social Share */}
            <div className="flex gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check out this property: ${publicUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn text-sm flex items-center gap-1"
                style={{ background: '#25D366', color: 'white' }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this property: ${publicUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn text-sm flex items-center gap-1"
                style={{ background: '#1DA1F2', color: 'white' }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn text-sm flex items-center gap-1"
                style={{ background: '#1877F2', color: 'white' }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </a>
            </div>
          </div>
        )}

        {/* Units Table */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>{t('units')} ({units.length})</h2>
            <Link href="/units" className="btn btn-secondary text-sm">{t('manageUnits')}</Link>
          </div>
          {units.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-light)' }}>{t('noUnits')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>{t('unitNumber')}</th>
                    <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>{t('beds')}</th>
                    <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>{t('baths')}</th>
                    <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>{t('toilets')}</th>
                    <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>{t('rent')}</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>{t('status')}</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--text-light)' }}>{t('tenant')}</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map(unit => (
                    <tr key={unit.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 px-4 font-medium" style={{ color: 'var(--text)' }}>{unit.unit_number}</td>
                      <td className="py-3 px-4 text-center" style={{ color: 'var(--text-light)' }}>{unit.bedrooms}</td>
                      <td className="py-3 px-4 text-center" style={{ color: 'var(--text-light)' }}>{unit.bathrooms}</td>
                      <td className="py-3 px-4 text-center" style={{ color: 'var(--text-light)' }}>{unit.toilets}</td>
                      <td className="py-3 px-4 text-right">{unit.price_rent ? `₦${Number(unit.price_rent).toLocaleString()}` : '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${unit.status === 'Available' ? 'badge-success' : unit.status === 'Occupied' ? 'badge-info' : 'badge-warning'}`}>
                          {t(`unitStatus.${unit.status.toLowerCase()}` as any) || unit.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-light)' }}>{unit.tenant_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <ConfirmDialog
          open={deleteTarget}
          title={t('deleteTitle')}
          message={t('deleteMessage', { name: property.name })}
          onConfirm={() => { setDeleteTarget(false); return handleDelete(); }}
          onCancel={() => setDeleteTarget(false)}
        />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
