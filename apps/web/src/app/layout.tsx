import type { Metadata } from 'next';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../messages/fr.json';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'MediFlow — ERP clinique',
  description: 'Gestion clinique, dossiers patients et opérations terrain.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/mediflow-mark.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr" suppressHydrationWarning><body><NextIntlClientProvider locale="fr" messages={messages}><Providers>{children}</Providers></NextIntlClientProvider></body></html>;
}
