import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Nunito_Sans } from 'next/font/google';
import './globals.css';
import { site } from '@/lib/config';
import RestaurantJsonLd from '@/components/seo/RestaurantJsonLd';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
});
const body = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '800'],
});

const title = `${site.name}: Mie Ayam, Yamin & Ramen di Jakarta`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: `%s | ${site.name}` },
  description: site.description,
  keywords: site.keywords,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: site.name,
    title,
    description: site.description,
    url: '/',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Momiega' }],
  },
  twitter: { card: 'summary_large_image', title, description: site.description },
};

export const viewport: Viewport = { themeColor: '#F7D046' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable}`}>
      <body className="bg-white font-sans text-kuah antialiased">
        <RestaurantJsonLd />
        {children}
      </body>
    </html>
  );
}
