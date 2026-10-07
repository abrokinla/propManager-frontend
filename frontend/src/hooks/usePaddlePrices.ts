'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface LocalizedPrice {
  price_id: string;
  unit_price: { amount: string; currency_code: string };
  billing_cycle: { interval: string; frequency: number };
  trial_period?: { interval: string; frequency: number };
}

interface UsePaddlePricesResult {
  localizedPrices: Map<string, LocalizedPrice>;
  loading: Set<string>;
  error: Set<string>;
  fetchPrices: (priceIds: string[]) => Promise<void>;
}

const CACHE_KEY = 'paddle_price_preview_cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getCache(): Map<string, { data: LocalizedPrice; timestamp: number }> {
  if (typeof window === 'undefined') return new Map();
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return new Map(Object.entries(parsed));
    }
  } catch {
    // ignore parse errors
  }
  return new Map();
}

function setCache(cache: Map<string, { data: LocalizedPrice; timestamp: number }>) {
  if (typeof window === 'undefined') return;
  try {
    const obj = Object.fromEntries(cache);
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch {
    // ignore quota errors
  }
}

function formatLocalized(amountMinor: string, currencyCode: string): string {
  const amountMajor = parseInt(amountMinor, 10) / 100;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: amountMajor % 1 === 0 ? 0 : 2,
  }).format(amountMajor);
}

export function usePaddlePrices(): UsePaddlePricesResult {
  const [localizedPrices, setLocalizedPrices] = useState<Map<string, LocalizedPrice>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [error, setError] = useState<Set<string>>(new Set());

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load cache on mount
  useEffect(() => {
    const cache = getCache();
    const now = Date.now();
    const valid = new Map<string, LocalizedPrice>();
    cache.forEach((value, key) => {
      if (now - value.timestamp < CACHE_TTL_MS) {
        valid.set(key, value.data);
      }
    });
    setLocalizedPrices(valid);
  }, []);

  const fetchPrices = useCallback(async (priceIds: string[]) => {
    // Filter out empty/invalid IDs and already cached
    const uniqueIds = [...new Set(priceIds)].filter(
      (id) => id && !localizedPrices.has(id) && !loading.has(id) && !error.has(id)
    );
    if (uniqueIds.length === 0) return;

    // Debounce rapid calls
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    await new Promise<void>((resolve) => {
      debounceTimerRef.current = setTimeout(resolve, 150);
    });

    // Cancel previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading((prev) => new Set([...prev, ...uniqueIds]));

    try {
      const paddle = (window as any).Paddle;
      if (!paddle) {
        throw new Error('Paddle.js not loaded');
      }

      const response = await paddle.PricePreview({
        items: uniqueIds.map((price_id) => ({ price_id })),
        signal: abortControllerRef.current.signal,
      });

      const items = response?.items ?? [];
      const cache = getCache();
      const newPrices = new Map<string, LocalizedPrice>();

      items.forEach((item: any) => {
        const data: LocalizedPrice = {
          price_id: item.price_id,
          unit_price: item.unit_price,
          billing_cycle: item.billing_cycle,
          trial_period: item.trial_period,
        };
        newPrices.set(item.price_id, data);
        cache.set(item.price_id, { data, timestamp: Date.now() });
      });

      setCache(cache);
      setLocalizedPrices((prev) => new Map([...prev, ...newPrices]));
      setError((prev) => {
        const next = new Set(prev);
        uniqueIds.forEach((id) => next.delete(id));
        return next;
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('[Paddle] PricePreview failed:', err.message);
        setError((prev) => new Set([...prev, ...uniqueIds]));
      }
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        uniqueIds.forEach((id) => next.delete(id));
        return next;
      });
    }
  }, [localizedPrices, loading, error]);

  return { localizedPrices, loading, error, fetchPrices };
}

export function useLocalizedPrice(priceId: string | undefined) {
  const { localizedPrices, loading, error, fetchPrices } = usePaddlePrices();

  useEffect(() => {
    if (priceId) fetchPrices([priceId]);
  }, [priceId, fetchPrices]);

  const data = priceId ? localizedPrices.get(priceId) : null;
  const isLoading = priceId ? loading.has(priceId) : false;
  const hasError = priceId ? error.has(priceId) : false;

  return { data, isLoading, hasError, format: formatLocalized };
}