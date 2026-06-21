import type {Metadata} from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk, Lobster } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import TopProgressBar from '@/components/TopProgressBar';
import GlobalCursorTrail from '@/components/GlobalCursorTrail';

const plusJakartaStatus = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-lobster',
});

export const metadata: Metadata = {
  title: {
    default: 'FanraTech | Portofolio Desain Interaktif',
    template: '%s | FanraTech'
  },
  description: 'Portofolio desain interaktif dan responsif karya FanraTech dengan kustomisasi tingkat tinggi dan rancangan visual premium.',
  icons: {
    icon: 'https://res.cloudinary.com/dew39kqhy/image/upload/w_256,h_256,c_fill,r_max/v1779594254/FanraTech_esy4kn.png',
    shortcut: 'https://res.cloudinary.com/dew39kqhy/image/upload/w_256,h_256,c_fill,r_max/v1779594254/FanraTech_esy4kn.png',
    apple: 'https://res.cloudinary.com/dew39kqhy/image/upload/w_256,h_256,c_fill,r_max/v1779594254/FanraTech_esy4kn.png',
  },
  openGraph: {
    title: 'FanraTech - Galeri Portofolio Kreatif & Desain Interaktif',
    description: 'Jelajahi karya desain responsif, modern, dan minimalis monokrom berkelas tinggi dari FanraTech.',
    url: 'https://ais-dev-vqtfhj6hetg2uyxckv62zw-56491373313.asia-southeast1.run.app',
    siteName: 'FanraTech Hub',
    images: [
      {
        url: 'https://res.cloudinary.com/dew39kqhy/image/upload/f_auto,q_auto/v1779470340/ChatGPT_Image_23_Mei_2026_00.18.48_lpgxk6.png',
        width: 1200,
        height: 630,
        alt: 'FanraTech Studio Preview',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FanraTech | Portofolio Desain Premium',
    description: 'Keanggunan minimalis monokrom kelas tinggi dengan performa secepat kilat.',
    images: ['https://res.cloudinary.com/dew39kqhy/image/upload/f_auto,q_auto/v1779470340/ChatGPT_Image_23_Mei_2026_00.18.48_lpgxk6.png'],
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${plusJakartaStatus.variable} ${spaceGrotesk.variable} ${lobster.variable}`} suppressHydrationWarning>
      <body className="font-sans bg-[#F9FAFB] text-[#111827] antialiased" suppressHydrationWarning>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <GlobalCursorTrail />
        {children}
      </body>
    </html>
  );
}
