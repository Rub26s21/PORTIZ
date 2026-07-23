import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import GlobalEffects from '@/components/effects/GlobalEffects';

export const metadata: Metadata = {
  title: 'Electronic Club ⚡ Quiz Portal',
  description:
    'The Ultimate Electronics Competition Platform for Future Engineers. Test your knowledge across multiple rounds of challenging questions.',
  keywords: ['electronics', 'quiz', 'competition', 'engineering', 'college', 'circuit'],
  openGraph: {
    title: 'Electronic Club Quiz Portal',
    description: 'The Ultimate Electronics Competition Platform for Future Engineers',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--space-void)] text-[var(--text-primary)] antialiased">
        {/* Global galaxy effects */}
        <GlobalEffects />

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(26, 15, 53, 0.95)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              color: '#F8F4FF',
              backdropFilter: 'blur(20px)',
              fontFamily: 'DM Sans, sans-serif',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#F8F4FF',
              },
            },
            error: {
              iconTheme: {
                primary: '#F43F5E',
                secondary: '#F8F4FF',
              },
            },
          }}
        />

        {/* Main content above aurora */}
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}
