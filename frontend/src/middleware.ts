import createI18nMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n-config';

export default createI18nMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)']
};
