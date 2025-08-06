import type { Metadata } from 'next';
import './globals.css';
import AppProviders from '@/components/AppProviders';

export const metadata: Metadata = {
  title: 'Kirain\'G',
  description: 'A modern social web app for sharing notes and thoughts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased h-full bg-background">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
