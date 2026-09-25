import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MediFlow — ERP clinique',
    short_name: 'MediFlow',
    description: 'Gestion clinique, dossiers patients et opérations terrain.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f7fb',
    theme_color: '#2c8a82',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/mediflow-mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/mediflow-mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
