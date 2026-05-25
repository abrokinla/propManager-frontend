'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import type { PublicProperty } from '../../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ListingsPage() {
  const [properties, setProperties] = useState<PublicProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const { data } = await axios.get<{ results: PublicProperty[] }>(`${API_URL}/public/properties/`);
        setProperties(data.results);
      } catch {
        setError('Unable to load listings at this time. Please check back later.');
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

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
              <span className="font-bold text-lg">PropManager</span>
            </div>
            <Link href="/login" className="btn btn-primary text-sm">Agent Login</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Your Perfect Property</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Browse our curated selection of available properties for rent.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">Listings Unavailable</h3>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">No Properties Listed Yet</h3>
            <p className="text-gray-500">Check back soon for new listings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((prop) => (
              <Link key={prop.id} href={`/listings/${prop.id}`} className="group">
                <div className="card overflow-hidden hover:shadow-lg transition-shadow">
                  {prop.image_url ? (
                    <div className="h-48 -mx-6 -mt-6 mb-4 overflow-hidden">
                      <img src={prop.image_url} alt={prop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="h-48 -mx-6 -mt-6 mb-4 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                      <svg className="w-12 h-12 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                  )}
                  <span className="badge badge-info mb-3">{prop.property_type}</span>
                  <h2 className="font-semibold text-lg mb-1 group-hover:text-primary-600 transition-colors">{prop.name}</h2>
                  <p className="text-gray-500 text-sm mb-3 flex items-center gap-1">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {prop.address}
                  </p>
                  <div className="flex items-center justify-between text-sm border-t pt-4 mt-4">
                    <span className="text-primary-600 font-semibold">
                      {prop.price_range
                        ? `$${prop.price_range.min.toLocaleString()} - $${prop.price_range.max.toLocaleString()}`
                        : 'Contact for price'}
                    </span>
                    <span className="text-gray-500">{prop.available_units_count} unit{prop.available_units_count !== 1 ? 's' : ''} available</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t bg-white mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} PropManager. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
