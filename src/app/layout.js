import Script from 'next/script';
import './globals.css';

export const metadata = {
  metadataBase: new URL('https://dad-ruddy.vercel.app'), // Placeholder URL, update as needed
  title: {
    default: 'Dad Jokes | The Best Dad Jokes on the Internet',
    template: '%s | Dad Jokes',
  },
  description: 'Get your daily dose of the cheesiest, most groan-worthy dad jokes. Click anywhere to get a new joke with a confetti celebration! Save, vote, and share your favorites.',
  keywords: ['dad jokes', 'funny jokes', 'humor', 'comedy', 'puns', 'groaners', 'daily jokes'],
  authors: [{ name: 'DadBot' }],
  creator: 'DadBot',
  publisher: 'DadBot',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Dad Jokes | The Best Dad Jokes on the Internet',
    description: 'The internet\'s finest collection of groan-worthy, eye-rolling, absolutely legendary dad jokes.',
    url: 'https://dad-ruddy.vercel.app',
    siteName: 'Dad Jokes',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dad Jokes | The Best Dad Jokes on the Internet',
    description: 'The internet\'s finest collection of groan-worthy, eye-rolling, absolutely legendary dad jokes.',
    creator: '@dadjokes',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'google-adsense-account': 'ca-pub-4560998920680293',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4560998920680293"
          crossorigin="anonymous"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
