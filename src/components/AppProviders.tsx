
'use client';

import { Toaster } from '@/components/ui/toaster';
import MainLayout from '@/components/layout/MainLayout';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <MainLayout>{children}</MainLayout>
      <Toaster />
    </ThemeProvider>
  );
}
