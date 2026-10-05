export const locales = ['en', 'es', 'pt-BR'] as const;
export const defaultLocale = 'en' as const;
export type Locale = typeof locales[number];
