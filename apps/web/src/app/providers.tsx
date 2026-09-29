'use client';

import { ThemeProvider } from 'next-themes';
import { PwaRegister } from '@/components/layout/pwa-register';
import { UiLocaleProvider } from '@/lib/ui-i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false} themes={['light', 'dark', 'clinical']}><UiLocaleProvider><PwaRegister />{children}</UiLocaleProvider></ThemeProvider>;
}
