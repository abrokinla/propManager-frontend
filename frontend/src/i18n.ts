import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './i18n-config';

export default getRequestConfig(async ({ requestLocale }) => {
  let resolvedLocale = await requestLocale;

  if (!resolvedLocale || !locales.includes(resolvedLocale as any)) {
    try {
      const { headers } = await import('next/headers');
      const h = await headers();
      const pathname =
        h.get('x-invoke-path') ||
        h.get('x-matched-path') ||
        h.get('x-next-url') ||
        '';
      for (const locale of locales) {
        if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
          resolvedLocale = locale;
          break;
        }
      }
    } catch {}
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
