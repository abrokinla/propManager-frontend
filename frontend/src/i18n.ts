import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './i18n-config';

async function detectLocale(): Promise<string | undefined> {
  try {
    const { headers } = await import('next/headers');
    const h = await headers();
    for (const key of ['x-invoke-path', 'x-matched-path', 'x-next-url', 'referer']) {
      const val = h.get(key) || '';
      for (const locale of locales) {
        if (val.startsWith(`/${locale}/`) || val === `/${locale}`) return locale;
      }
    }
  } catch {}
  try {
    const { cookies } = await import('next/headers');
    const c = await cookies();
    const nextLocale = c.get('NEXT_LOCALE')?.value;
    if (nextLocale && locales.includes(nextLocale as any)) return nextLocale;
  } catch {}
  return undefined;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let resolvedLocale = await requestLocale;

  if (!resolvedLocale || !locales.includes(resolvedLocale as any)) {
    resolvedLocale = await detectLocale();
  }

  const currentLocale = locales.includes(resolvedLocale as any)
    ? (resolvedLocale as typeof locales[number])
    : defaultLocale;

  try {
    const messages = (await import(`./messages/${currentLocale}.json`)).default;
    return { messages, locale: currentLocale };
  } catch {
    const fallback = (await import(`./messages/${defaultLocale}.json`)).default;
    return { messages: fallback, locale: defaultLocale };
  }
});
