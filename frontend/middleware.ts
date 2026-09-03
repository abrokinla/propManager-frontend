import createI18nMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n-config';

export default createI18nMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export const config = {
  matcher: ['/', '/(en|es)/:path*']
};
