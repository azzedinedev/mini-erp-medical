'use client';

import { ThemeProvider } from 'next-themes';
import { useEffect } from 'react';
import { PwaRegister } from '@/components/layout/pwa-register';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const locale = window.localStorage.getItem('mediflow-locale') ?? 'fr';
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, []);

  return <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false} themes={['light', 'dark', 'clinical']}><PwaRegister />{children}</ThemeProvider>;
}
