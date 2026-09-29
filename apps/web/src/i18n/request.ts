import { getRequestConfig } from 'next-intl/server';

const supportedLocales = ['fr', 'ar', 'en', 'es'] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = supportedLocales.includes(requested as (typeof supportedLocales)[number]) ? requested : 'fr';
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages };
});
