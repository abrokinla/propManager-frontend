'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '../../../../navigation';
import { useParams, useSearchParams } from 'next/navigation';
import axios from 'axios';
import type { PublicPropertyDetail } from '../../../../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ListingDetailPage() {
  const t = useTranslations('ListingsDetail');
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const [property, setProperty] = useState<PublicPropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestForm, setInterestForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [interestSubmitting, setInterestSubmitting] = useState(false);
  const [interestSubmitted, setInterestSubmitted] = useState(false);
  const [interestError, setInterestError] = useState('');

  useEffect(() => {
    if (!slug) return;
    const fetchDetail = async () => {
      try {
        const { data } = await axios.get<PublicPropertyDetail>(`${API_URL}/public/properties/slug/${slug}/`);
        setProperty(data);
      } catch {
        setError(t('loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  // Track page view
  useEffect(() => {
    if (!slug) return;
    const utmSource = searchParams.get('utm_source') || '';
    const utmMedium = searchParams.get('utm_medium') || '';
    const utmCampaign = searchParams.get('utm_campaign') || '';
    axios.post(`${API_URL}/public/properties/slug/${slug}/view/`, {
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      page_path: `/listings/${slug}`,
    }).catch(() => { /* silent */ });
  }, [slug, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <h3 className="font-semibold text-lg mb-2">{t('notFound')}</h3>
          <p className="text-gray-500 mb-4">{error || t('notFoundDescription')}</p>
          <Link href="/listings" className="btn btn-primary">{t('browseListings')}</Link>
        </div>
      </div>
    );
  }

  const { available_units } = property;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <span className="font-bold text-lg">{t('brand')}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/listings" className="text-gray-600 hover:text-gray-900 font-medium">{t('allListings')}</Link>
              <Link href="/login" className="btn btn-primary text-sm">{t('agentLogin')}</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/listings" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('backToListings')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-8">
            {property.image_url ? (
              <div className="rounded-xl overflow-hidden">
                <img src={property.image_url} alt={property.name} className="w-full h-96 object-cover" />
              </div>
            ) : (
              <div className="h-96 bg-gradient-to-br from-primary-100 to-primary-50 rounded-xl flex items-center justify-center">
                <svg className="w-16 h-16 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
            )}

            <div>
              <span className="badge badge-info text-sm">{property.property_type}</span>
              <h1 className="text-3xl font-bold mt-3 mb-2">{property.name}</h1>
              <p className="text-gray-500 flex items-center gap-1 mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {property.address}
              </p>

              {property.description && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-3">{t('aboutThisProperty')}</h2>
                  <p className="text-gray-600 leading-relaxed">{property.description}</p>
                </div>
              )}

              {property.amenities && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-3">{t('amenities')}</h2>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.split(',').map((a, i) => (
                      <span key={i} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">{a.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {property.nearby_places && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-3">{t('nearbyPlaces')}</h2>
                  <div className="flex flex-wrap gap-2">
                    {property.nearby_places.split(',').map((p, i) => (
                      <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">{p.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Units */}
              {available_units && available_units.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">{t('availableUnits', { count: available_units.length })}</h2>
                  <div className="space-y-4">
                    {available_units.map((unit) => (
                      <div key={unit.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{t('unitLabel', { number: unit.unit_number })}</p>
                          <p className="text-sm text-gray-500">
                            {unit.bedrooms} {t('beds', { count: unit.bedrooms })} &middot; {unit.bathrooms} {t('baths', { count: unit.bathrooms })}
                            {unit.toilets != null && unit.toilets > 0 && ` · ${unit.toilets} ${t('toilets', { count: unit.toilets })}`}
                            {unit.size_sqft && ` · ${unit.size_sqft} sqft`}
                          </p>
                        </div>
                        <div className="text-right">
                          {unit.price_rent && <p className="font-bold text-primary-600">${unit.price_rent.toLocaleString()}/{unit.rent_cycle === 'daily' ? t('perDay') : unit.rent_cycle === 'monthly' ? t('perMonth') : t('perYear')}</p>}
                          {unit.price_sale && unit.price_sale > 0 && <p className="text-sm text-gray-500">${unit.price_sale.toLocaleString()} sale</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Contact / Summary */}
          <div className="space-y-6">
            <div className="card sticky top-8">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-primary-600">
                  {property.price_range
                    ? `$${property.price_range.min.toLocaleString()} - $${property.price_range.max.toLocaleString()}`
                    : t('contactForPrice')}
                </p>
                <p className="text-sm text-gray-500 mt-1">{t('perYear')}</p>
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('propertyType')}</span>
                  <span className="font-medium">{property.property_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('totalUnits')}</span>
                  <span className="font-medium">{property.total_units}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('available')}</span>
                  <span className="font-medium text-green-600">{property.available_units_count}</span>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href={`/listings/${slug}/book`}
                  className="btn btn-primary w-full text-center block mb-3"
                >
                  {t('bookVisit')}
                </Link>
                <button
                  onClick={() => setShowInterestModal(true)}
                  className="btn btn-secondary w-full text-center"
                >
                  {t('expressInterest')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} PropManager. {t('allRightsReserved')}
        </div>
      </footer>

      {/* Express Interest Modal */}
      {showInterestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowInterestModal(false); setInterestSubmitted(false); setInterestError(''); }}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            {interestSubmitted ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('expressInterestTitle')}</h3>
                <p className="text-sm text-gray-500 mb-6">{t('interestSubmitted')}</p>
                <button onClick={() => { setShowInterestModal(false); setInterestSubmitted(false); }} className="btn btn-primary">Close</button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">{t('expressInterestTitle')}</h3>
                {interestError && <p className="text-sm text-red-600 mb-3">{interestError}</p>}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setInterestSubmitting(true);
                  setInterestError('');
                  try {
                    await axios.post(`${API_URL}/public/properties/slug/${slug}/express-interest/`, interestForm);
                    setInterestSubmitted(true);
                    setInterestForm({ name: '', email: '', phone: '', message: '' });
                  } catch (err: any) {
                    setInterestError(err.response?.data?.error || t('interestFailed'));
                  } finally {
                    setInterestSubmitting(false);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">{t('interestName')}</label>
                    <input
                      type="text"
                      value={interestForm.name}
                      onChange={e => setInterestForm({ ...interestForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">{t('interestEmail')}</label>
                    <input
                      type="email"
                      value={interestForm.email}
                      onChange={e => setInterestForm({ ...interestForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">{t('interestPhone')}</label>
                    <input
                      type="tel"
                      value={interestForm.phone}
                      onChange={e => setInterestForm({ ...interestForm, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="+234..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">{t('interestMessage')}</label>
                    <textarea
                      value={interestForm.message}
                      onChange={e => setInterestForm({ ...interestForm, message: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                      placeholder={t('interestMessagePlaceholder')}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => { setShowInterestModal(false); setInterestSubmitted(false); setInterestError(''); }} className="btn btn-secondary">Cancel</button>
                    <button type="submit" disabled={interestSubmitting} className="btn btn-primary disabled:opacity-50">
                      {interestSubmitting ? t('interestSubmitting') : t('expressInterest')}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
