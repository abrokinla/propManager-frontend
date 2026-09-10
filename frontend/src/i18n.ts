import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './i18n-config';

export default getRequestConfig(async ({ requestLocale }) => {
  const resolvedLocale = await requestLocale;
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
